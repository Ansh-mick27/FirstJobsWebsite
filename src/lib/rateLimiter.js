const WINDOW_MS = 60_000; // 1 minute sliding window

const LIMITS = {
    questions: 30,
    companies: 60,
    execute: 20,
};

// Map<`${endpoint}:${ip}`, { count: number, windowStart: number }>
const store = new Map();

export function checkRateLimit(ip, endpoint) {
    const limit = LIMITS[endpoint] ?? 30;
    const key = `${endpoint}:${ip}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now - entry.windowStart > WINDOW_MS) {
        store.set(key, { count: 1, windowStart: now });
        return { allowed: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
        const retryAfter = Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000);
        return { allowed: false, remaining: 0, retryAfter };
    }

    entry.count += 1;
    return { allowed: true, remaining: limit - entry.count };
}
