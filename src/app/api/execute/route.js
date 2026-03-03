import { NextResponse } from 'next/server';

const PISTON_URL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston';

/**
 * POST /api/execute
 * Body: { language: string, code: string, testCases: { input: string, output: string }[] }
 *
 * Proxies code execution to the Piston API to avoid browser CORS issues.
 * Runs each test case individually and returns pass/fail results.
 *
 * Returns: { results: { input, expected, actual, passed }[] }
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

    try {
        const results = await Promise.all(
            testCases.map(async (tc) => {
                const res = await fetch(`${PISTON_URL}/execute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        language,
                        version: '*',
                        files: [{ content: code }],
                        stdin: tc.input,
                    }),
                });

                if (!res.ok) {
                    const errText = await res.text();
                    throw new Error(`Piston API error: ${res.status} ${errText}`);
                }

                const data = await res.json();
                const actual = data.run?.stdout?.trim() ?? '';
                const expected = tc.output?.trim() ?? '';

                return {
                    input: tc.input,
                    expected,
                    actual,
                    passed: actual === expected,
                    stderr: data.run?.stderr || null,
                };
            })
        );

        return NextResponse.json({ results });
    } catch (error) {
        console.error('[POST /api/execute]', error);
        return NextResponse.json({ error: 'Code execution failed' }, { status: 500 });
    }
}
