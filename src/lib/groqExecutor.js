/**
 * groqExecutor.js
 *
 * LLM-based dry-run fallback for code execution.
 * Used by /api/execute when Judge0 is unreachable (network error, timeout, or
 * service outage). Groq traces the user's function against each test-case input
 * and predicts the stdout output.
 *
 * Important: expected outputs are NEVER sent to the model. Groq must reason from
 * the code alone. Pass/fail is determined here by comparing Groq's predicted
 * output against the stored expected output — same trim-equality check as Judge0.
 */

import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

// ─── Prompt builder ───────────────────────────────────────────────────────────

function inputFormatHint(params) {
    return params.map((p, i) => {
        let fmt = '';
        if (p.type.endsWith('[][]')) fmt = '— row-count on first line, then each row as space-separated values';
        else if (p.type.endsWith('[]')) fmt = '— space-separated values on one line';
        return `  Line ${i + 1}: ${p.name} (${p.type}) ${fmt}`.trimEnd();
    }).join('\n');
}

function outputFormatHint(returnType) {
    if (returnType.endsWith('[][]')) return 'each row on its own line, values space-separated';
    if (returnType.endsWith('[]')) return 'space-separated values on one line';
    if (returnType === 'bool') return '"true" or "false" (lowercase)';
    return 'the value as a plain string';
}

function buildPrompt(userCode, language, testCases, functionSignature) {
    const langLabel = {
        javascript: 'JavaScript', python: 'Python', cpp: 'C++', java: 'Java',
    }[language] || language;

    const inputList = testCases
        .map((tc, i) => `  { "id": ${i}, "input": ${JSON.stringify(tc.input ?? '')} }`)
        .join(',\n');

    const isFunctionMode = !!(functionSignature?.name && functionSignature.params?.length);

    let sigBlock = '';
    let traceInstruction = 'Trace this code for each input below and return the exact stdout output it would produce.';

    if (isFunctionMode) {
        const paramStr = functionSignature.params.map(p => `${p.name}: ${p.type}`).join(', ');
        sigBlock = `
Function signature: ${functionSignature.name}(${paramStr}) -> ${functionSignature.returnType}

Input format (one argument per line of stdin):
${inputFormatHint(functionSignature.params)}

Output format: ${outputFormatHint(functionSignature.returnType)}
`;
        traceInstruction = `The code defines a function. For each test input:
1. Parse the input lines into function arguments using the input format above.
2. Trace the function body step by step with those arguments.
3. Format the function's return value using the output format above.
4. That formatted string is the "actual" value — the string that would be printed to stdout.`;
    }

    return `You are a precise ${langLabel} code execution simulator. Your job is to trace code and predict its output — not to judge whether it is correct.
${sigBlock}
Code to trace:
\`\`\`${language}
${userCode}
\`\`\`

${traceInstruction}

Test inputs:
[
${inputList}
]

Rules:
1. Trace the actual code logic step by step. Do not assume the code is correct.
2. Do not use the function name or parameter names to guess what the output should be — follow what the code actually does.
3. Return the output string exactly as it would appear (trimmed, no trailing newline).
4. If the code would throw a runtime error, divide by zero, cause infinite recursion, or similar for a given input — set "actual" to "" and "stderr" to a one-line description.
5. Return ONLY a raw JSON object, no markdown, no prose:
{"results": [{"id": 0, "actual": "...", "stderr": null}, {"id": 1, "actual": "...", "stderr": null}]}`;
}

// ─── JSON extractor (same approach as generate-questions route) ───────────────

function extractJson(raw = '') {
    const stripped = raw.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
    const start = stripped.search(/[{[]/);
    if (start === -1) throw new Error('No JSON found in model response');
    const opener = stripped[start];
    const closer = opener === '{' ? '}' : ']';
    let depth = 0;
    let end = -1;
    for (let i = start; i < stripped.length; i++) {
        if (stripped[i] === opener) depth++;
        else if (stripped[i] === closer) { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end === -1) throw new Error('Unterminated JSON in model response');
    return JSON.parse(stripped.slice(start, end + 1));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Asks Groq to trace userCode for each test case and predict stdout output.
 * Returns results in the same shape as runOneTestCase in /api/execute.
 *
 * @param {string} userCode          Raw function code (no harness wrapper).
 * @param {string} language          'javascript' | 'python' | 'cpp' | 'java'
 * @param {{ input: string, output: string }[]} testCases
 * @param {object|null} functionSignature  { name, params, returnType } or null
 * @returns {Promise<object[]>}
 */
export async function groqDryRun(userCode, language, testCases, functionSignature) {
    const prompt = buildPrompt(userCode, language, testCases, functionSignature);

    let llmResults = [];
    try {
        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0,
            max_tokens: 2048,
            // response_format omitted intentionally — Groq's JSON validation
            // can throw 400 on structured output; we parse manually instead.
        });

        const raw = completion.choices[0]?.message?.content || '';
        const parsed = extractJson(raw);
        llmResults = Array.isArray(parsed.results) ? parsed.results : [];
    } catch (err) {
        // Groq call itself failed — return uniform error for all test cases
        const errMsg = `Code runner unavailable and LLM fallback failed: ${err.message}`;
        return testCases.map(tc => ({
            input: tc.input ?? '',
            expected: tc.output?.trim() ?? '',
            actual: '',
            passed: false,
            stderr: errMsg,
            source: 'llm',
        }));
    }

    // Map Groq's per-id results back to indexed test cases and evaluate pass/fail
    return testCases.map((tc, i) => {
        const expected = tc.output?.trim() ?? '';
        const hit = llmResults.find(r => r.id === i);

        if (!hit) {
            return {
                input: tc.input ?? '',
                expected,
                actual: '',
                passed: false,
                stderr: 'LLM did not return a result for this test case.',
                source: 'llm',
            };
        }

        const actual = (hit.actual ?? '').trim();
        return {
            input: tc.input ?? '',
            expected,
            actual,
            passed: actual === expected,
            stderr: hit.stderr || null,
            source: 'llm',
        };
    });
}
