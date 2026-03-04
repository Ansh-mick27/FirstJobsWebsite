/**
 * PlacePrep — Company Seed Script
 * Run: node scripts/seed-companies.mjs
 *
 * Seeds TCS, Bajaj Finserv, and ConsultAdd into Firestore with
 * realistic questions matching the PlacePrep schema.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// ──────────────────────────────────────────
// Init Firebase Admin from .env.local directly
// ──────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const envRaw = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
    envRaw.split('\n')
        .filter(l => l.trim() && !l.startsWith('#'))
        .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    });
}

const db = getFirestore();
const now = Timestamp.now();

// ──────────────────────────────────────────
// DATA
// ──────────────────────────────────────────

const companies = [
    {
        id: 'tcs',
        data: {
            name: 'TCS',
            slug: 'tcs',
            logo: null,
            industry: 'IT Services',
            description: 'Tata Consultancy Services (TCS) is India\'s largest IT services company and a global leader in digital transformation. A top mass recruiter from engineering colleges, TCS hires thousands of freshers every year through its National Qualifier Test (NQT). Known for structured on-boarding, extensive training programs (ILP), and a wide range of technology domains from cloud to AI.',
            hiringStatus: 'Active',
            rounds: { oa: true, technical: true, hr: true },
            tags: ['mass-recruiter', 'service', 'it-services', 'nqt'],
            createdAt: now,
        },
        questions: [
            // OA — MCQ
            {
                text: 'What is the time complexity of binary search on a sorted array of n elements?',
                type: 'mcq',
                round: 'oa',
                year: 2024,
                difficulty: 'Easy',
                tags: ['algorithms', 'searching', 'complexity'],
                options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
                correctAnswer: 1,
                explanation: 'Binary search halves the search space at each step, resulting in O(log n) time complexity.',
                starterCode: null, solution: null, testCases: null,
            },
            {
                text: 'Which of the following is NOT a feature of Object-Oriented Programming?',
                type: 'mcq',
                round: 'oa',
                year: 2024,
                difficulty: 'Easy',
                tags: ['oops', 'concepts'],
                options: ['Encapsulation', 'Polymorphism', 'Compilation', 'Inheritance'],
                correctAnswer: 2,
                explanation: 'Compilation is a process feature of languages, not a pillar of OOP. The four pillars are Encapsulation, Polymorphism, Inheritance, and Abstraction.',
                starterCode: null, solution: null, testCases: null,
            },
            {
                text: 'A train travels 360 km at 90 km/h and returns at 60 km/h. What is the average speed for the entire journey?',
                type: 'mcq',
                round: 'oa',
                year: 2023,
                difficulty: 'Medium',
                tags: ['aptitude', 'speed-distance-time'],
                options: ['72 km/h', '75 km/h', '80 km/h', '70 km/h'],
                correctAnswer: 0,
                explanation: 'Average speed = 2 × (90 × 60) / (90 + 60) = 10800 / 150 = 72 km/h.',
                starterCode: null, solution: null, testCases: null,
            },
            {
                text: 'Which SQL clause is used to filter groups in a GROUP BY query?',
                type: 'mcq',
                round: 'oa',
                year: 2024,
                difficulty: 'Easy',
                tags: ['sql', 'databases'],
                options: ['WHERE', 'HAVING', 'FILTER', 'LIMIT'],
                correctAnswer: 1,
                explanation: 'HAVING is used to filter results after GROUP BY, while WHERE filters individual rows before grouping.',
                starterCode: null, solution: null, testCases: null,
            },
            // Technical — MCQ
            {
                text: 'What does the "S" in SOLID principles stand for?',
                type: 'mcq',
                round: 'technical',
                year: 2024,
                difficulty: 'Easy',
                tags: ['design-patterns', 'solid', 'oop'],
                options: ['Scalability Principle', 'Single Responsibility Principle', 'Separation of Concerns', 'Static Binding Principle'],
                correctAnswer: 1,
                explanation: 'S stands for Single Responsibility Principle — a class should have only one reason to change.',
                starterCode: null, solution: null, testCases: null,
            },
            {
                text: 'In Java, which keyword is used to prevent a class from being subclassed?',
                type: 'mcq',
                round: 'technical',
                year: 2023,
                difficulty: 'Easy',
                tags: ['java', 'oops'],
                options: ['static', 'abstract', 'final', 'sealed'],
                correctAnswer: 2,
                explanation: 'The `final` keyword prevents a class from being extended/subclassed in Java.',
                starterCode: null, solution: null, testCases: null,
            },
            // Technical — Coding
            {
                text: '**Reverse a String**\n\nGiven a string `s`, return it reversed without using built-in reverse functions.\n\n**Example:**\n```\nInput:  "hello"\nOutput: "olleh"\n```\n\n**Constraints:**\n- 1 ≤ s.length ≤ 10⁵\n- s consists of printable ASCII characters',
                type: 'coding',
                round: 'technical',
                year: 2024,
                difficulty: 'Easy',
                tags: ['strings', 'two-pointer'],
                options: null, correctAnswer: null, explanation: null,
                starterCode: {
                    python: 'def reverse_string(s: str) -> str:\n    # Write your solution here\n    pass\n',
                    javascript: 'function reverseString(s) {\n    // Write your solution here\n}\n',
                    java: 'public class Solution {\n    public String reverseString(String s) {\n        // Write your solution here\n        return "";\n    }\n}\n',
                },
                solution: 'def reverse_string(s: str) -> str:\n    return s[::-1]\n',
                testCases: [
                    { input: 'hello', output: 'olleh', isHidden: false },
                    { input: 'world', output: 'dlrow', isHidden: false },
                    { input: 'a', output: 'a', isHidden: true },
                    { input: 'abcde', output: 'edcba', isHidden: true },
                ],
            },
            // HR — subjective
            {
                text: 'Tell me about yourself and why you want to join TCS.',
                type: 'subjective',
                round: 'hr',
                year: 2024,
                difficulty: 'Easy',
                tags: ['hr', 'introduction', 'motivation'],
                options: null, correctAnswer: null, explanation: 'This is your opening pitch. Mention your background (college, branch, CGPA), a key project or skill, and tie it to TCS\'s mission in digital transformation.',
                starterCode: null, solution: null, testCases: null,
            },
            {
                text: 'Describe a situation where you faced a challenge in a team project and how you resolved it.',
                type: 'subjective',
                round: 'hr',
                year: 2023,
                difficulty: 'Medium',
                tags: ['hr', 'behavioural', 'teamwork'],
                options: null, correctAnswer: null, explanation: 'Use the STAR method: Situation, Task, Action, Result. Be specific and honest.',
                starterCode: null, solution: null, testCases: null,
            },
        ],
    },
    {
        id: 'bajaj-finserv',
        data: {
            name: 'Bajaj Finserv',
            slug: 'bajaj-finserv',
            logo: null,
            industry: 'BFSI / Fintech',
            description: 'Bajaj Finserv is one of India\'s most diversified financial services conglomerates spanning lending, insurance, and payments. It recruits tech and finance graduates for engineering, analytics, and product roles. The hiring process focuses heavily on aptitude, logical reasoning, and domain knowledge in finance and technology.',
            hiringStatus: 'Active',
            rounds: { oa: true, technical: true, hr: true },
            tags: ['fintech', 'bfsi', 'analytics', 'finance'],
            createdAt: now,
        },
        questions: [
            // OA
            {
                text: 'If a sum of ₹5,000 is invested at 8% per annum compound interest for 2 years, what is the total amount?',
                type: 'mcq',
                round: 'oa',
                year: 2024,
                difficulty: 'Medium',
                tags: ['aptitude', 'compound-interest', 'finance'],
                options: ['₹5,832', '₹5,800', '₹5,640', '₹5,950'],
                correctAnswer: 0,
                explanation: 'A = P(1 + r/100)^t = 5000 × (1.08)² = 5000 × 1.1664 = ₹5,832.',
                starterCode: null, solution: null, testCases: null,
            },
            {
                text: 'What does EMI stand for in the context of loan repayment?',
                type: 'mcq',
                round: 'oa',
                year: 2024,
                difficulty: 'Easy',
                tags: ['finance', 'domain-knowledge'],
                options: ['Equal Monthly Installment', 'Equated Monthly Installment', 'Expected Monthly Interest', 'Estimated Monthly Income'],
                correctAnswer: 1,
                explanation: 'EMI stands for Equated Monthly Installment — a fixed payment made by a borrower to a lender at a specified date each month.',
                starterCode: null, solution: null, testCases: null,
            },
            {
                text: 'In a series of numbers: 2, 6, 12, 20, 30, … what is the next number?',
                type: 'mcq',
                round: 'oa',
                year: 2023,
                difficulty: 'Medium',
                tags: ['aptitude', 'number-series'],
                options: ['40', '42', '44', '36'],
                correctAnswer: 1,
                explanation: 'Differences are 4, 6, 8, 10, 12 — increasing by 2 each time. So next: 30 + 12 = 42.',
                starterCode: null, solution: null, testCases: null,
            },
            // Technical
            {
                text: 'Which of the following Python data structures maintains insertion order and allows duplicates?',
                type: 'mcq',
                round: 'technical',
                year: 2024,
                difficulty: 'Easy',
                tags: ['python', 'data-structures'],
                options: ['set', 'dict (keys only)', 'list', 'frozenset'],
                correctAnswer: 2,
                explanation: 'A Python `list` maintains insertion order and allows duplicate values.',
                starterCode: null, solution: null, testCases: null,
            },
            {
                text: 'In the context of databases, what does ACID stand for?',
                type: 'mcq',
                round: 'technical',
                year: 2024,
                difficulty: 'Medium',
                tags: ['databases', 'sql', 'transactions'],
                options: [
                    'Atomicity, Consistency, Isolation, Durability',
                    'Accuracy, Correctness, Integration, Data',
                    'Atomicity, Concurrency, Integrity, Durability',
                    'Accuracy, Consistency, Isolation, Durability',
                ],
                correctAnswer: 0,
                explanation: 'ACID = Atomicity (all or nothing), Consistency (valid state), Isolation (concurrent transactions), Durability (committed data persists).',
                starterCode: null, solution: null, testCases: null,
            },
            {
                text: '**Count Vowels**\n\nGiven a string, return the count of vowels (a, e, i, o, u — case-insensitive).\n\n**Example:**\n```\nInput:  "Bajaj Finserv"\nOutput: 4\n```',
                type: 'coding',
                round: 'technical',
                year: 2024,
                difficulty: 'Easy',
                tags: ['strings', 'iteration'],
                options: null, correctAnswer: null, explanation: null,
                starterCode: {
                    python: 'def count_vowels(s: str) -> int:\n    # Write your solution here\n    pass\n',
                    javascript: 'function countVowels(s) {\n    // Write your solution here\n}\n',
                },
                solution: "def count_vowels(s: str) -> int:\n    return sum(1 for c in s.lower() if c in 'aeiou')\n",
                testCases: [
                    { input: 'Bajaj Finserv', output: '4', isHidden: false },
                    { input: 'hello world', output: '3', isHidden: false },
                    { input: 'AEIOU', output: '5', isHidden: true },
                    { input: 'xyz', output: '0', isHidden: true },
                ],
            },
            // HR
            {
                text: 'Why do you want to work in the BFSI sector specifically?',
                type: 'subjective',
                round: 'hr',
                year: 2024,
                difficulty: 'Medium',
                tags: ['hr', 'motivation', 'finance'],
                options: null, correctAnswer: null, explanation: 'Interviewers want to see genuine interest. Mention fintech\'s growth, impact on financial inclusion, or specific products (EMI, insurance) that interest you.',
                starterCode: null, solution: null, testCases: null,
            },
            {
                text: 'Where do you see yourself in 3 years?',
                type: 'subjective',
                round: 'hr',
                year: 2023,
                difficulty: 'Easy',
                tags: ['hr', 'career-goals'],
                options: null, correctAnswer: null, explanation: 'Be realistic and align with the company\'s growth path. Mention skill development, taking ownership of projects, and growing within the organisation.',
                starterCode: null, solution: null, testCases: null,
            },
        ],
    },
    {
        id: 'consultadd',
        data: {
            name: 'ConsultAdd',
            slug: 'consultadd',
            logo: null,
            industry: 'IT Consulting',
            description: 'ConsultAdd is a fast-growing IT consulting and staffing firm that recruits heavily from tier-2 and tier-3 engineering colleges. They offer training and placement for fresh graduates in technologies like Java, .NET, Python, and cloud platforms. The selection process is notably thorough — with aptitude, coding, and multiple technical rounds.',
            hiringStatus: 'Active',
            rounds: { oa: true, technical: true, hr: true },
            tags: ['it-consulting', 'service', 'tier2-friendly', 'training-and-placement'],
            createdAt: now,
        },
        questions: [
            // OA
            {
                text: 'Which of the following has the best average-case time complexity for searching?',
                type: 'mcq',
                round: 'oa',
                year: 2024,
                difficulty: 'Easy',
                tags: ['algorithms', 'searching', 'complexity'],
                options: ['Linear Search', 'Binary Search', 'Hash Table Lookup', 'B-Tree Search'],
                correctAnswer: 2,
                explanation: 'Hash table lookups are O(1) on average, making them the fastest for search among these options.',
                starterCode: null, solution: null, testCases: null,
            },
            {
                text: 'Two pipes A and B can fill a tank in 12 min and 18 min respectively. If both are opened together, how long to fill the tank?',
                type: 'mcq',
                round: 'oa',
                year: 2024,
                difficulty: 'Medium',
                tags: ['aptitude', 'time-and-work'],
                options: ['6.5 min', '7.2 min', '8 min', '9 min'],
                correctAnswer: 1,
                explanation: 'Combined rate = 1/12 + 1/18 = 3/36 + 2/36 = 5/36. Time = 36/5 = 7.2 minutes.',
                starterCode: null, solution: null, testCases: null,
            },
            {
                text: 'What is the output of: print(type([]) == type(()))  in Python?',
                type: 'mcq',
                round: 'oa',
                year: 2023,
                difficulty: 'Easy',
                tags: ['python', 'data-types'],
                options: ['True', 'False', 'Error', 'None'],
                correctAnswer: 1,
                explanation: 'type([]) is <class \'list\'> and type(()) is <class \'tuple\'> — they are different types, so the comparison is False.',
                starterCode: null, solution: null, testCases: null,
            },
            // Technical — MCQ
            {
                text: 'Which HTTP method is idempotent but NOT safe?',
                type: 'mcq',
                round: 'technical',
                year: 2024,
                difficulty: 'Medium',
                tags: ['web', 'rest-api', 'http'],
                options: ['GET', 'POST', 'PUT', 'DELETE'],
                correctAnswer: 2,
                explanation: 'PUT is idempotent (same result if called multiple times) but not safe (it modifies state). GET is both safe and idempotent. POST is neither.',
                starterCode: null, solution: null, testCases: null,
            },
            {
                text: 'In Java, what is the difference between `==` and `.equals()` for String comparison?',
                type: 'mcq',
                round: 'technical',
                year: 2024,
                difficulty: 'Easy',
                tags: ['java', 'strings'],
                options: [
                    'They are identical',
                    '== compares references, .equals() compares content',
                    '== compares content, .equals() compares references',
                    'Both compare content only',
                ],
                correctAnswer: 1,
                explanation: '`==` checks if two references point to the same object in memory. `.equals()` checks if the character content is identical.',
                starterCode: null, solution: null, testCases: null,
            },
            // Technical — Coding
            {
                text: '**Find Duplicates**\n\nGiven an array of integers, return all elements that appear more than once. The result should be in sorted order.\n\n**Example:**\n```\nInput:  [4, 3, 2, 7, 8, 2, 3, 1]\nOutput: [2, 3]\n```',
                type: 'coding',
                round: 'technical',
                year: 2024,
                difficulty: 'Medium',
                tags: ['arrays', 'hash-map', 'collections'],
                options: null, correctAnswer: null, explanation: null,
                starterCode: {
                    python: 'def find_duplicates(nums: list[int]) -> list[int]:\n    # Write your solution here\n    pass\n',
                    javascript: 'function findDuplicates(nums) {\n    // Write your solution here\n}\n',
                    java: 'import java.util.*;\npublic class Solution {\n    public List<Integer> findDuplicates(int[] nums) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}\n',
                },
                solution: 'def find_duplicates(nums):\n    from collections import Counter\n    return sorted(k for k, v in Counter(nums).items() if v > 1)\n',
                testCases: [
                    { input: '[4, 3, 2, 7, 8, 2, 3, 1]', output: '[2, 3]', isHidden: false },
                    { input: '[1, 1, 2]', output: '[1]', isHidden: false },
                    { input: '[1, 2, 3]', output: '[]', isHidden: true },
                    { input: '[5, 5, 5, 3, 3, 1]', output: '[3, 5]', isHidden: true },
                ],
            },
            // HR
            {
                text: 'Are you comfortable with a service-based role that may require client-site travel or relocation?',
                type: 'subjective',
                round: 'hr',
                year: 2024,
                difficulty: 'Easy',
                tags: ['hr', 'flexibility', 'willingness'],
                options: null, correctAnswer: null, explanation: 'Be honest. If yes, mention your adaptability. If you have constraints, state them professionally while expressing your commitment to the role.',
                starterCode: null, solution: null, testCases: null,
            },
            {
                text: 'Rate your proficiency in Java and Python on a scale of 1-10, and explain your reasoning.',
                type: 'subjective',
                round: 'hr',
                year: 2023,
                difficulty: 'Easy',
                tags: ['hr', 'self-evaluation', 'technical-skills'],
                options: null, correctAnswer: null, explanation: 'Be honest — interviewers will probe your claimed rating. Back it with specific projects or coursework. Never rate yourself 10/10; it signals overconfidence.',
                starterCode: null, solution: null, testCases: null,
            },
        ],
    },
];

// ──────────────────────────────────────────
// SEED
// ──────────────────────────────────────────

async function seed() {
    console.log('🌱 PlacePrep — Seeding companies to Firestore...\n');

    for (const company of companies) {
        const companyRef = db.collection('companies').doc(company.id);
        await companyRef.set(company.data);
        console.log(`✅ Company created: ${company.data.name} (id: ${company.id})`);

        // Add questions as subcollection
        for (const q of company.questions) {
            const { text, type, round, year, difficulty, tags, options, correctAnswer, explanation, starterCode, solution, testCases } = q;
            await companyRef.collection('questions').add({
                text, type, round, year, difficulty, tags,
                options: options ?? null,
                correctAnswer: correctAnswer ?? null,
                explanation: explanation ?? null,
                starterCode: starterCode ?? null,
                solution: solution ?? null,
                testCases: testCases ?? null,
                createdAt: now,
            });
        }
        console.log(`   └─ 📝 ${company.questions.length} questions added\n`);
    }

    console.log('🎉 Seed complete! All companies are live in Firestore.');
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
