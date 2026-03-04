import { NextResponse } from 'next/server';

/**
 * Judge0 CE language IDs — https://ce.judge0.com/languages/
 */
const JUDGE0_LANG = {
    javascript: 63,   // Node.js 12.14.0
    python: 71,   // Python 3.8.1
    cpp: 54,   // C++ (GCC 9.2.0) — C++17
    java: 62,   // Java OpenJDK 13
    'c++': 54,
    py: 71,
    js: 63,
};

/**
 * API config — override via .env.local:
 *   JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
 *   JUDGE0_API_KEY=<your-rapidapi-key>
 */
const JUDGE0_URL = (process.env.JUDGE0_API_URL || 'https://ce.judge0.com').replace(/\/$/, '');
const JUDGE0_KEY = process.env.JUDGE0_API_KEY || null;
const IS_RAPIDAPI = JUDGE0_URL.includes('rapidapi');

function makeHeaders() {
    const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (IS_RAPIDAPI && JUDGE0_KEY) {
        h['X-RapidAPI-Key'] = JUDGE0_KEY;
        h['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
    }
    return h;
}

const EXEC_TIMEOUT_MS = 15000; // abort entire fetch after 15s
const POLL_INTERVAL_MS = 1200;

async function runOneTestCase(languageId, code, stdin, expectedOutput) {
    const expected = expectedOutput?.trim() ?? '';

    // --- Submit (async) ---
    const submitCtrl = new AbortController();
    const submitTimer = setTimeout(() => submitCtrl.abort(), EXEC_TIMEOUT_MS);

    let token;
    try {
        const res = await fetch(
            `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
            {
                method: 'POST',
                headers: makeHeaders(),
                body: JSON.stringify({
                    language_id: languageId,
                    source_code: code,
                    stdin: stdin ?? '',
                    cpu_time_limit: 5,
                    memory_limit: 262144,
                }),
                signal: submitCtrl.signal,
            }
        );
        clearTimeout(submitTimer);
        if (!res.ok) {
            const t = await res.text().catch(() => String(res.status));
            throw new Error(`Submit error ${res.status}: ${t}`);
        }
        ({ token } = await res.json());
    } catch (err) {
        clearTimeout(submitTimer);
        const isTimeout = err.name === 'AbortError';
        return {
            input: stdin,
            expected,
            actual: '',
            passed: false,
            stderr: isTimeout
                ? '⏱ Code runner is busy. Please try again in a few seconds.'
                : `Submit failed: ${err.message}`,
        };
    }

    // --- Poll until done ---
    const deadline = Date.now() + EXEC_TIMEOUT_MS;
    while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        try {
            const res = await fetch(
                `${JUDGE0_URL}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,status,exit_code`,
                { headers: makeHeaders() }
            );
            if (!res.ok) continue;
            const data = await res.json();

            // Status 1=In Queue, 2=Processing → keep waiting
            if (!data.status || data.status.id <= 2) continue;

            const stdout = data.stdout ?? '';
            const errText = data.stderr || data.compile_output || null;
            const actual = stdout.trim();
            const hasError = data.status.id > 3; // 3=Accepted

            return {
                input: stdin,
                expected,
                actual: hasError ? '' : actual,
                passed: !hasError && actual === expected,
                stderr: hasError
                    ? `${data.status.description}${errText ? ': ' + errText.trim() : ''}`
                    : (errText?.trim() || null),
                exitCode: data.exit_code ?? null,
            };
        } catch {
            // transient poll error — retry
        }
    }

    return {
        input: stdin,
        expected,
        actual: '',
        passed: false,
        stderr: '⏱ Execution timed out waiting for judge response. Try again.',
    };
}

/**
 * POST /api/execute
 * Body: { language: string, code: string, testCases: { input: string, output: string }[] }
 */
export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { language, code, testCases } = body;

    if (!language || !code || !Array.isArray(testCases) || testCases.length === 0) {
        return NextResponse.json(
            { error: 'language, code, and testCases[] are required' },
            { status: 400 }
        );
    }

    const langId = JUDGE0_LANG[language.toLowerCase()];
    if (!langId) {
        return NextResponse.json(
            { error: `Unsupported language: "${language}". Supported: javascript, python, cpp, java` },
            { status: 400 }
        );
    }

    try {
        // Run all test cases concurrently
        const results = await Promise.all(
            testCases.map(tc => runOneTestCase(langId, code, tc.input ?? '', tc.output))
        );
        return NextResponse.json({ results });
    } catch (error) {
        console.error('[POST /api/execute]', error);
        return NextResponse.json(
            { error: 'Code execution failed', detail: error.message },
            { status: 500 }
        );
    }
}
