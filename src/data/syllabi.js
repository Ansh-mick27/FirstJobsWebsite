/**
 * PlacePrep — Company Syllabi
 *
 * Data structure:
 * topics: [
 *   {
 *     id: string,
 *     name: string,
 *     icon: string (emoji),
 *     prepHours: number,    // estimated hours to prepare this entire topic
 *     importance: 'must' | 'good' | 'optional',
 *     subtopics: [
 *       {
 *         name: string,
 *         importance: 'must' | 'good' | 'optional',
 *         resources?: string[],  // optional reference names
 *         note?: string,         // short tip for this subtopic
 *       }
 *     ]
 *   }
 * ]
 */

export const SYLLABI = {

    tcs: {
        companyName: 'TCS',
        lastUpdated: '2024',
        overview: 'TCS NQT covers three sections: Verbal, Numerical & Reasoning, and Programming Logic. The technical interview tests core CS fundamentals. HR is conversational and assesses attitude and communication.',
        topics: [
            {
                id: 'verbal',
                name: 'Verbal Ability',
                icon: '💬',
                prepHours: 12,
                importance: 'must',
                subtopics: [
                    { name: 'Reading Comprehension', importance: 'must', note: 'Usually 2 passages with 5 questions each. Practice timed reading.' },
                    { name: 'Synonyms & Antonyms', importance: 'must', note: 'Focus on vocab from GRE word lists.' },
                    { name: 'Fill in the Blanks', importance: 'must' },
                    { name: 'Sentence Correction & Error Spotting', importance: 'good' },
                    { name: 'Para Jumbles', importance: 'good', note: 'Usually 1-2 questions in NQT.' },
                    { name: 'Idioms & Phrases', importance: 'optional' },
                ],
            },
            {
                id: 'quant',
                name: 'Quantitative & Reasoning',
                icon: '🔢',
                prepHours: 20,
                importance: 'must',
                subtopics: [
                    { name: 'Number System & LCM/HCF', importance: 'must' },
                    { name: 'Percentage, Profit & Loss', importance: 'must' },
                    { name: 'Time, Speed & Distance', importance: 'must', note: 'Trains, boats, and average speed problems are common.' },
                    { name: 'Time & Work', importance: 'must' },
                    { name: 'Simple & Compound Interest', importance: 'must' },
                    { name: 'Ratio, Proportion & Mixtures', importance: 'good' },
                    { name: 'Blood Relations', importance: 'must' },
                    { name: 'Seating Arrangement', importance: 'must' },
                    { name: 'Syllogisms', importance: 'good' },
                    { name: 'Data Interpretation (Tables & Charts)', importance: 'good' },
                    { name: 'Coding-Decoding', importance: 'good' },
                    { name: 'Direction Sense', importance: 'optional' },
                ],
            },
            {
                id: 'programming',
                name: 'Programming & CS Fundamentals',
                icon: '💻',
                prepHours: 30,
                importance: 'must',
                subtopics: [
                    { name: 'Programming Logic & Flow Control', importance: 'must', note: 'Output-based questions in any language (C/C++/Java/Python).' },
                    { name: 'Arrays & Strings', importance: 'must' },
                    { name: 'Time & Space Complexity (Big-O)', importance: 'must' },
                    { name: 'Sorting Algorithms (Bubble, Quick, Merge)', importance: 'must' },
                    { name: 'Searching — Linear vs Binary', importance: 'must' },
                    { name: 'OOP Concepts (Encapsulation, Polymorphism, Inheritance, Abstraction)', importance: 'must' },
                    { name: 'Linked Lists — Basics', importance: 'good' },
                    { name: 'Stacks & Queues', importance: 'good' },
                    { name: 'Recursion & Backtracking', importance: 'good' },
                    { name: 'Basic SQL — SELECT, JOIN, GROUP BY, HAVING', importance: 'good' },
                    { name: 'Trees & Graphs — Traversal Basics', importance: 'optional' },
                ],
            },
            {
                id: 'technical_interview',
                name: 'Technical Interview',
                icon: '🖥️',
                prepHours: 20,
                importance: 'must',
                subtopics: [
                    { name: 'DBMS Fundamentals — ACID, Normalization, Joins', importance: 'must' },
                    { name: 'OS Concepts — Processes, Threads, Deadlock, Paging', importance: 'must' },
                    { name: 'Computer Networks — OSI Model, TCP/IP, HTTP vs HTTPS', importance: 'must' },
                    { name: 'OOPS in your preferred language', importance: 'must' },
                    { name: 'Design Patterns — Singleton, Factory (basics)', importance: 'good' },
                    { name: 'Cloud Computing — Basics of AWS/Azure', importance: 'optional' },
                ],
            },
            {
                id: 'hr',
                name: 'HR Interview',
                icon: '🤝',
                prepHours: 5,
                importance: 'must',
                subtopics: [
                    { name: 'Tell Me About Yourself (2-min pitch)', importance: 'must', note: 'Structure: background → skills → a key project → why TCS.' },
                    { name: 'Strengths & Weaknesses', importance: 'must' },
                    { name: 'Why TCS?', importance: 'must', note: 'Research TCS ILP program, Ignite, and their digital transformation focus.' },
                    { name: 'Where do you see yourself in 5 years?', importance: 'must' },
                    { name: 'STAR Method for Behavioural Questions', importance: 'good', note: 'Situation, Task, Action, Result — practice with 3 stories from your experience.' },
                    { name: 'Salary Expectations & Bond Clause Queries', importance: 'good' },
                ],
            },
        ],
    },

    'bajaj-finserv': {
        companyName: 'Bajaj Finserv',
        lastUpdated: '2024',
        overview: 'Bajaj Finserv focuses on aptitude, logical reasoning, and domain knowledge in Finance & Technology. The technical round tests coding and system design for tech roles, while HR evaluates attitude and BFSI domain interest.',
        topics: [
            {
                id: 'aptitude',
                name: 'Quantitative Aptitude',
                icon: '📊',
                prepHours: 18,
                importance: 'must',
                subtopics: [
                    { name: 'Simple & Compound Interest', importance: 'must', note: 'Very relevant for BFSI — also appears in finance domain questions.' },
                    { name: 'Percentage & Profit/Loss', importance: 'must' },
                    { name: 'Ratio & Proportion', importance: 'must' },
                    { name: 'Time & Work / Pipes & Cisterns', importance: 'must' },
                    { name: 'Number Series & Pattern Finding', importance: 'must' },
                    { name: 'Data Interpretation', importance: 'good', note: 'Bar charts and tables; 2-3 sets in the OA.' },
                    { name: 'Permutations & Combinations', importance: 'good' },
                    { name: 'Probability', importance: 'good' },
                ],
            },
            {
                id: 'logical',
                name: 'Logical Reasoning',
                icon: '🧩',
                prepHours: 12,
                importance: 'must',
                subtopics: [
                    { name: 'Syllogisms', importance: 'must' },
                    { name: 'Blood Relations', importance: 'must' },
                    { name: 'Seating Arrangement (Circular & Linear)', importance: 'must' },
                    { name: 'Puzzles', importance: 'must' },
                    { name: 'Coding-Decoding', importance: 'good' },
                    { name: 'Direction Sense', importance: 'good' },
                    { name: 'Statement & Assumption', importance: 'good' },
                ],
            },
            {
                id: 'finance_domain',
                name: 'Finance Domain Knowledge',
                icon: '💰',
                prepHours: 15,
                importance: 'must',
                subtopics: [
                    { name: 'What is EMI? How is it calculated?', importance: 'must', note: 'EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]' },
                    { name: 'Types of Loans — Personal, Home, Auto, Business', importance: 'must' },
                    { name: 'Insurance Basics — Life, Health, General', importance: 'must' },
                    { name: 'Credit Score & CIBIL', importance: 'must', note: 'Know the range, what affects it, and its importance.' },
                    { name: 'Mutual Funds & SIP Basics', importance: 'good' },
                    { name: 'RBI, SEBI, IRDAI — roles', importance: 'good' },
                    { name: 'UPI, Payment Gateways, Digital Banking', importance: 'good' },
                    { name: 'Financial Statements — P&L, Balance Sheet', importance: 'optional' },
                ],
            },
            {
                id: 'tech',
                name: 'Technical (For Tech Roles)',
                icon: '💻',
                prepHours: 25,
                importance: 'must',
                subtopics: [
                    { name: 'Data Structures — Arrays, HashMap, LinkedList', importance: 'must' },
                    { name: 'Algorithms — Sorting, Searching', importance: 'must' },
                    { name: 'SQL — Joins, Aggregation, Subqueries', importance: 'must', note: 'Bajaj uses SQL extensively for analytics roles.' },
                    { name: 'Python Basics — for analytics/data roles', importance: 'good' },
                    { name: 'REST APIs and System Design Basics', importance: 'good' },
                    { name: 'Cloud & DevOps Basics', importance: 'optional' },
                ],
            },
            {
                id: 'hr_bajaj',
                name: 'HR Round',
                icon: '🤝',
                prepHours: 4,
                importance: 'must',
                subtopics: [
                    { name: 'Why Bajaj Finserv / Why BFSI?', importance: 'must', note: 'Research their flagship products — Bajaj EMI Card, Bajaj Health EMI Card, Bajaj Allianz.' },
                    { name: 'Career Goals — 3-5 year vision', importance: 'must' },
                    { name: 'Teamwork & Conflict Resolution', importance: 'good' },
                    { name: 'Openness to Relocation / Travel', importance: 'good' },
                ],
            },
        ],
    },

    consultadd: {
        companyName: 'ConsultAdd',
        lastUpdated: '2024',
        overview: 'ConsultAdd has a rigorous multi-round process: Aptitude → Group Discussion → Technical (2 rounds) → HR. They focus on depth of knowledge in Java/.NET/Python and cloud readiness. Training is extensive, so attitude and learning aptitude matter as much as current skill.',
        topics: [
            {
                id: 'aptitude_ca',
                name: 'Aptitude & Reasoning',
                icon: '🔢',
                prepHours: 15,
                importance: 'must',
                subtopics: [
                    { name: 'Averages, Percentage, Ratio', importance: 'must' },
                    { name: 'Time & Work / Pipes', importance: 'must' },
                    { name: 'Speed, Distance & Time', importance: 'must' },
                    { name: 'Logical Reasoning — Puzzles & Seating', importance: 'must' },
                    { name: 'Data Sufficiency', importance: 'good' },
                    { name: 'Coding-Decoding / Series', importance: 'good' },
                ],
            },
            {
                id: 'gd',
                name: 'Group Discussion Prep',
                icon: '🗣️',
                prepHours: 6,
                importance: 'must',
                subtopics: [
                    { name: 'AI in IT & Consulting', importance: 'must', note: 'Common GD topic at ConsultAdd. Prepare pros/cons and real examples.' },
                    { name: 'Work From Home vs Office', importance: 'must' },
                    { name: 'Campus to Corporate Transition', importance: 'must' },
                    { name: 'Tech Ethics & Data Privacy', importance: 'good' },
                    { name: 'Communication & Assertiveness Skills', importance: 'must', note: 'Be the first to speak. Summarise the group at the end.' },
                ],
            },
            {
                id: 'core_java',
                name: 'Core Java / OOPs',
                icon: '☕',
                prepHours: 30,
                importance: 'must',
                subtopics: [
                    { name: 'OOP — Classes, Objects, Constructors', importance: 'must' },
                    { name: 'Inheritance, Polymorphism, Encapsulation, Abstraction', importance: 'must' },
                    { name: 'Interfaces vs Abstract Classes', importance: 'must', note: 'Be ready to write code and explain the difference verbally.' },
                    { name: 'Exception Handling (try/catch/finally)', importance: 'must' },
                    { name: 'Collections Framework — List, Set, Map', importance: 'must' },
                    { name: 'String class — immutability, StringBuilder', importance: 'must' },
                    { name: `== vs .equals() for Strings`, importance: 'must' },
                    { name: 'final, static, volatile keywords', importance: 'good' },
                    { name: 'Java 8 Features — Lambdas, Streams, Optional', importance: 'good' },
                    { name: 'Multithreading Basics', importance: 'good' },
                ],
            },
            {
                id: 'ds_algo',
                name: 'Data Structures & Algorithms',
                icon: '🌲',
                prepHours: 25,
                importance: 'must',
                subtopics: [
                    { name: 'Arrays — Rotation, Searching, Duplicates', importance: 'must' },
                    { name: 'Strings — Palindrome, Anagram, Reversal', importance: 'must' },
                    { name: 'HashMap — Frequency Counting', importance: 'must' },
                    { name: 'Sorting — Bubble, Merge, Quick (implementation)', importance: 'must' },
                    { name: 'Linked List — Reversal, Cycle Detection', importance: 'good' },
                    { name: 'Stack & Queue — Applications', importance: 'good' },
                    { name: 'Binary Search — Variants', importance: 'good' },
                    { name: 'Trees — BFS/DFS Traversal', importance: 'optional' },
                    { name: 'Dynamic Programming — Basic Problems', importance: 'optional' },
                ],
            },
            {
                id: 'web_db',
                name: 'Web & Database',
                icon: '🗄️',
                prepHours: 12,
                importance: 'good',
                subtopics: [
                    { name: 'SQL — CRUD, Joins, Aggregate Functions', importance: 'must' },
                    { name: 'REST API Concepts — GET/POST/PUT/DELETE, idempotency', importance: 'must' },
                    { name: 'HTTP Methods & Status Codes', importance: 'must' },
                    { name: 'DBMS — ACID, Normalization (1NF–3NF)', importance: 'good' },
                    { name: 'Spring Boot / any Web Framework Basics', importance: 'good' },
                    { name: 'Microservices Basics', importance: 'optional' },
                ],
            },
            {
                id: 'hr_ca',
                name: 'HR Round',
                icon: '🤝',
                prepHours: 4,
                importance: 'must',
                subtopics: [
                    { name: 'Introduction — College, CGPA, Key Projects', importance: 'must' },
                    { name: 'Why ConsultAdd / IT Consulting?', importance: 'must', note: 'Mention their training program, tier-2 college focus, and growth track.' },
                    { name: 'Preferred Technology Stack & Self-rating', importance: 'must', note: 'Never rate yourself 10/10. 7-8 is ideal — shows confidence without arrogance.' },
                    { name: 'Relocation Willingness', importance: 'must' },
                    { name: 'Long-term Career Goals', importance: 'good' },
                ],
            },
        ],
    },
};

// ─── Per-Role Rich Syllabi ────────────────────────────────────────────────────
// Keyed by [companySlug][roleName] — matched case-insensitively via getRoleSyllabus()
export const ROLE_SYLLABI = {

    // ── TCS ──────────────────────────────────────────────────────────────────
    tcs: {
        'Software Engineer': {
            overview: 'TCS NQT covers Verbal, Numerical & Reasoning, and Programming Logic. Technical round tests core CS fundamentals. HR is conversational. Clear all three to land the offer.',
            lastUpdated: '2024',
            topics: [
                {
                    id: 'nqt_verbal', name: 'Verbal Ability', icon: '💬', prepHours: 12, importance: 'must',
                    subtopics: [
                        { name: 'Reading Comprehension (timed)', importance: 'must', note: 'Two passages, 5 Qs each. Practice under 10 min per passage.' },
                        { name: 'Synonyms & Antonyms', importance: 'must', note: 'GRE word lists are gold.' },
                        { name: 'Fill in the Blanks', importance: 'must' },
                        { name: 'Sentence Correction & Error Spotting', importance: 'good' },
                        { name: 'Para Jumbles', importance: 'good' },
                        { name: 'Idioms & Phrases', importance: 'optional' },
                    ],
                },
                {
                    id: 'nqt_quant', name: 'Quantitative & Reasoning', icon: '🔢', prepHours: 20, importance: 'must',
                    subtopics: [
                        { name: 'Number System & LCM/HCF', importance: 'must' },
                        { name: 'Percentages, Profit & Loss', importance: 'must' },
                        { name: 'Time, Speed & Distance', importance: 'must', note: 'Trains, boats, average speed — all common.' },
                        { name: 'Time & Work', importance: 'must' },
                        { name: 'Blood Relations', importance: 'must' },
                        { name: 'Seating Arrangement', importance: 'must' },
                        { name: 'Syllogisms', importance: 'good' },
                        { name: 'Data Interpretation', importance: 'good' },
                        { name: 'Coding-Decoding', importance: 'good' },
                    ],
                },
                {
                    id: 'nqt_prog', name: 'Programming & CS Fundamentals', icon: '💻', prepHours: 30, importance: 'must',
                    subtopics: [
                        { name: 'Output-based Q in C/C++/Java/Python', importance: 'must', note: 'Most common question type in NQT programming section.' },
                        { name: 'Arrays & Strings basics', importance: 'must' },
                        { name: 'Time & Space Complexity (Big-O)', importance: 'must' },
                        { name: 'Sorting — Bubble, Quick, Merge', importance: 'must' },
                        { name: 'OOP — Encapsulation, Polymorphism, Inheritance', importance: 'must' },
                        { name: 'Linked Lists basics', importance: 'good' },
                        { name: 'Recursion basics', importance: 'good' },
                        { name: 'Basic SQL — SELECT, JOIN, GROUP BY', importance: 'good' },
                    ],
                },
                {
                    id: 'tech_int', name: 'Technical Interview', icon: '🖥️', prepHours: 20, importance: 'must',
                    subtopics: [
                        { name: 'DBMS — ACID, Normalization, Joins', importance: 'must' },
                        { name: 'OS — Processes, Threads, Deadlock, Paging', importance: 'must' },
                        { name: 'Networks — OSI Model, TCP/IP, HTTP vs HTTPS', importance: 'must' },
                        { name: 'OOP in your preferred language', importance: 'must' },
                        { name: 'Design Patterns — Singleton, Factory', importance: 'good' },
                        { name: 'Cloud Basics', importance: 'optional' },
                    ],
                },
                {
                    id: 'hr_tcs', name: 'HR Interview', icon: '🤝', prepHours: 5, importance: 'must',
                    subtopics: [
                        { name: 'Tell Me About Yourself (2-min pitch)', importance: 'must', note: 'Background → skills → project → why TCS.' },
                        { name: 'Strengths & Weaknesses', importance: 'must' },
                        { name: 'Why TCS?', importance: 'must', note: 'Mention TCS ILP, Ignite, Digital transformation focus.' },
                        { name: '5-year plan', importance: 'must' },
                        { name: 'STAR Method for Behavioural Qs', importance: 'good' },
                        { name: 'Bond/Salary Queries', importance: 'good' },
                    ],
                },
            ],
        },

        'BDE': {
            overview: "TCS BDE (Business Development Executive) has no OA. Process is HR + Managerial. Focus on communication, sales aptitude, and knowledge of TCS's digital offerings. Attitude matters more than technical depth here.",
            lastUpdated: '2024',
            topics: [
                {
                    id: 'comm', name: 'Communication & Presentation', icon: '🎤', prepHours: 10, importance: 'must',
                    subtopics: [
                        { name: 'Structured verbal communication (PREP method)', importance: 'must', note: 'Point → Reason → Example → Point. Use this structure always.' },
                        { name: 'Active Listening signals', importance: 'must' },
                        { name: 'Presentation with confidence — no filler words', importance: 'must' },
                        { name: 'Email & written communication etiquette', importance: 'good' },
                        { name: 'Handling objections calmly', importance: 'good' },
                    ],
                },
                {
                    id: 'sales', name: 'Sales & Relationship Building', icon: '🤝', prepHours: 8, importance: 'must',
                    subtopics: [
                        { name: 'Consultative vs Transactional selling', importance: 'must', note: 'TCS is consultative — understand client need first.' },
                        { name: 'Identifying decision makers (B2B)', importance: 'must' },
                        { name: 'Negotiation basics', importance: 'good' },
                        { name: 'Account management & relationship tracking', importance: 'good' },
                        { name: 'CRM tools — Salesforce basics', importance: 'optional' },
                    ],
                },
                {
                    id: 'tcs_products', name: 'TCS Products & Digital Services', icon: '🏢', prepHours: 6, importance: 'must',
                    subtopics: [
                        { name: 'TCS Ignio (AI-powered platform)', importance: 'must', note: 'Know what problem it solves, not just the name.' },
                        { name: 'TCS BaNCS (banking solution)', importance: 'must' },
                        { name: 'TCS Digital Transformation offerings', importance: 'must' },
                        { name: 'Key industries TCS serves: BFSI, Retail, Healthcare', importance: 'good' },
                    ],
                },
                {
                    id: 'hr_bde', name: 'HR Round', icon: '🌟', prepHours: 6, importance: 'must',
                    subtopics: [
                        { name: 'Why sales/BDE at a tech company?', importance: 'must', note: 'Show genuine interest in tech + people intersection.' },
                        { name: 'Tell me about a time you persuaded someone', importance: 'must', note: 'Use STAR — keep it concrete and brief.' },
                        { name: 'Describe a failure & what you learned', importance: 'must' },
                        { name: 'Where do you see yourself in 3–5 years?', importance: 'must' },
                        { name: 'Relocation & travel readiness', importance: 'good' },
                    ],
                },
                {
                    id: 'managerial_bde', name: 'Managerial Round', icon: '📋', prepHours: 5, importance: 'must',
                    subtopics: [
                        { name: 'Leadership style & examples', importance: 'must', note: 'Use a specific college project or event leadership story.' },
                        { name: 'Conflict resolution scenarios', importance: 'must' },
                        { name: 'Decision making under pressure', importance: 'must' },
                        { name: 'Team collaboration & ownership', importance: 'must' },
                        { name: 'Target-driven mindset — handling rejection', importance: 'good' },
                    ],
                },
            ],
        },
    },

    // ── Bajaj Finserv ─────────────────────────────────────────────────────────
    'bajaj-finserv': {
        'Software Engineer': {
            overview: 'Bajaj Finserv SWE process: Aptitude OA → Technical Interview (DSA + System Design) → HR. Strong focus on data structures, SQL, and BFSI domain awareness. Python/Java preferred.',
            lastUpdated: '2024',
            topics: [
                {
                    id: 'aptitude_bse', name: 'Quantitative Aptitude & Reasoning', icon: '📊', prepHours: 15, importance: 'must',
                    subtopics: [
                        { name: 'Simple & Compound Interest', importance: 'must', note: 'BFSI context — very common.' },
                        { name: 'Percentage & Profit/Loss', importance: 'must' },
                        { name: 'Number Series', importance: 'must' },
                        { name: 'Data Interpretation (charts & tables)', importance: 'good' },
                        { name: 'Seating Arrangement & Puzzles', importance: 'good' },
                    ],
                },
                {
                    id: 'dsa_bse', name: 'Data Structures & Algorithms', icon: '🌲', prepHours: 25, importance: 'must',
                    subtopics: [
                        { name: 'Arrays, Strings, HashMap', importance: 'must' },
                        { name: 'Sorting & Searching algorithms', importance: 'must' },
                        { name: 'Stack, Queue, Linked List', importance: 'must' },
                        { name: 'Trees — BFS, DFS', importance: 'good' },
                        { name: 'DP — Fibonacci, Knapsack basics', importance: 'good' },
                    ],
                },
                {
                    id: 'sql_bse', name: 'SQL & Databases', icon: '🗃️', prepHours: 10, importance: 'must',
                    subtopics: [
                        { name: 'Joins — INNER, LEFT, RIGHT, FULL', importance: 'must', note: 'Bajaj uses SQL for analytics — expect complex join queries.' },
                        { name: 'Aggregation — GROUP BY, HAVING, COUNT, SUM', importance: 'must' },
                        { name: 'Subqueries & Window Functions', importance: 'must' },
                        { name: 'DBMS — ACID, Normalization', importance: 'good' },
                    ],
                },
                {
                    id: 'bfsi_domain', name: 'BFSI Domain Awareness', icon: '💰', prepHours: 8, importance: 'must',
                    subtopics: [
                        { name: 'EMI calculation & loan types', importance: 'must' },
                        { name: 'Credit Score & CIBIL basics', importance: 'must' },
                        { name: 'UPI, payment gateways, Digital Banking', importance: 'good' },
                        { name: 'Bajaj Finserv flagship products — EMI Card, etc.', importance: 'good' },
                    ],
                },
                {
                    id: 'hr_bfse', name: 'HR Round', icon: '🤝', prepHours: 4, importance: 'must',
                    subtopics: [
                        { name: 'Why Bajaj Finserv / Why BFSI?', importance: 'must' },
                        { name: 'Career Goals — 3–5 year vision', importance: 'must' },
                        { name: 'Teamwork & Conflict Resolution stories', importance: 'good' },
                        { name: 'Relocation/travel openness', importance: 'good' },
                    ],
                },
            ],
        },

        'Business Analyst': {
            overview: 'Bajaj Finserv BA process: Aptitude OA → Technical/Domain (SQL + analytics + finance) → HR. The role sits at intersection of tech and business — expect both SQL queries and domain discussions.',
            lastUpdated: '2024',
            topics: [
                {
                    id: 'analytics', name: 'Analytics & Quantitative Skills', icon: '📈', prepHours: 18, importance: 'must',
                    subtopics: [
                        { name: 'Data Interpretation — tables, charts, business metrics', importance: 'must' },
                        { name: 'Basic Statistics — mean, median, mode, standard deviation', importance: 'must', note: 'Comes up in BA interviews for Bajaj.' },
                        { name: 'KPIs for BFSI — NPA, CAR, LTV, churn rate', importance: 'must' },
                        { name: 'Excel/Google Sheets — VLOOKUP, pivot tables concept', importance: 'good' },
                        { name: 'A/B Testing basics', importance: 'optional' },
                    ],
                },
                {
                    id: 'sql_ba', name: 'SQL for Analysis', icon: '🗃️', prepHours: 15, importance: 'must',
                    subtopics: [
                        { name: 'Complex joins across 3+ tables', importance: 'must' },
                        { name: 'Window Functions — RANK, ROW_NUMBER, LAG/LEAD', importance: 'must', note: 'Essential for BA role at analytics-heavy company.' },
                        { name: 'Aggregation & Filtering', importance: 'must' },
                        { name: 'Writing business queries from problem statements', importance: 'must' },
                        { name: 'Index and query optimization basics', importance: 'good' },
                    ],
                },
                {
                    id: 'finance_ba', name: 'Finance Domain', icon: '💰', prepHours: 15, importance: 'must',
                    subtopics: [
                        { name: 'Loan lifecycle — origination to repayment', importance: 'must' },
                        { name: 'EMI, IRR, NPV basics', importance: 'must' },
                        { name: 'Credit scoring models', importance: 'must' },
                        { name: 'Insurance products — Life, Health, General', importance: 'good' },
                        { name: 'Regulatory bodies — RBI, SEBI, IRDAI', importance: 'good' },
                    ],
                },
                {
                    id: 'requirements', name: 'Requirements & Communication', icon: '📝', prepHours: 8, importance: 'must',
                    subtopics: [
                        { name: 'Writing BRD / user story format', importance: 'must' },
                        { name: 'Stakeholder communication & expectation management', importance: 'must' },
                        { name: 'Process flow diagrams (swimlane / BPMN basics)', importance: 'good' },
                        { name: 'Tools — JIRA, Confluence (conceptual)', importance: 'optional' },
                    ],
                },
                {
                    id: 'hr_ba', name: 'HR Round', icon: '🤝', prepHours: 4, importance: 'must',
                    subtopics: [
                        { name: 'Why BA role — bridge between tech and business', importance: 'must' },
                        { name: 'A project where your analysis led to a decision', importance: 'must', note: 'Use STAR — ideally a quantifiable outcome.' },
                        { name: 'Handling ambiguous requirements', importance: 'good' },
                    ],
                },
            ],
        },
    },

    // ── ConsultAdd ────────────────────────────────────────────────────────────
    consultadd: {
        'Java Developer': {
            overview: 'ConsultAdd Java process: Aptitude → GD → 2 Technical Rounds (Core Java + DSA) → HR. Deep Java & OOP mastery is non-negotiable. Spring Boot knowledge is a strong differentiator.',
            lastUpdated: '2024',
            topics: [
                {
                    id: 'core_java', name: 'Core Java & OOP', icon: '☕', prepHours: 35, importance: 'must',
                    subtopics: [
                        { name: 'OOP — Classes, Objects, Constructors', importance: 'must' },
                        { name: 'Inheritance, Polymorphism, Encapsulation, Abstraction', importance: 'must' },
                        { name: 'Interfaces vs Abstract Classes — write code', importance: 'must', note: 'Be ready to code AND explain the difference verbally.' },
                        { name: 'Exception Handling — try/catch/finally/throws', importance: 'must' },
                        { name: 'Collections — List, Set, Map, Iterator', importance: 'must' },
                        { name: 'String immutability & StringBuilder', importance: 'must' },
                        { name: '== vs .equals() for Strings', importance: 'must' },
                        { name: 'Java 8 — Lambdas, Streams, Optional, default methods', importance: 'good' },
                        { name: 'Multithreading — synchronized, Thread, Runnable', importance: 'good' },
                        { name: 'final, static, volatile keywords', importance: 'good' },
                    ],
                },
                {
                    id: 'spring', name: 'Spring Boot Basics', icon: '🌱', prepHours: 15, importance: 'good',
                    subtopics: [
                        { name: 'Spring Boot project structure & annotations', importance: 'must' },
                        { name: '@RestController, @GetMapping, @PostMapping', importance: 'must' },
                        { name: 'Dependency Injection — @Autowired, @Component, @Service', importance: 'must' },
                        { name: 'JPA / Hibernate basics — @Entity, @Repository', importance: 'good' },
                        { name: 'Application properties & profiles', importance: 'optional' },
                    ],
                },
                {
                    id: 'dsa_java', name: 'Data Structures & Algorithms', icon: '🌲', prepHours: 25, importance: 'must',
                    subtopics: [
                        { name: 'Arrays — rotation, duplicates, sliding window', importance: 'must' },
                        { name: 'Strings — palindrome, anagram, reversal', importance: 'must' },
                        { name: 'HashMap — frequency counting patterns', importance: 'must' },
                        { name: 'Sorting — Bubble, Merge, Quick (code it)', importance: 'must' },
                        { name: 'Linked List — reversal, cycle detection', importance: 'good' },
                        { name: 'Binary Search variants', importance: 'good' },
                        { name: 'Trees — BFS/DFS traversal', importance: 'optional' },
                        { name: 'DP — Fibonacci, coin change, knapsack', importance: 'optional' },
                    ],
                },
                {
                    id: 'db_java', name: 'SQL & Database', icon: '🗄️', prepHours: 12, importance: 'must',
                    subtopics: [
                        { name: 'CRUD — SELECT, INSERT, UPDATE, DELETE', importance: 'must' },
                        { name: 'Joins — INNER, LEFT, RIGHT, SELF', importance: 'must' },
                        { name: 'DBMS — ACID, Normalization 1NF–3NF', importance: 'must' },
                        { name: 'Stored Procedures & Triggers basics', importance: 'good' },
                    ],
                },
                {
                    id: 'gd_hr_java', name: 'GD + HR Round', icon: '🗣️', prepHours: 8, importance: 'must',
                    subtopics: [
                        { name: 'GD Topic: AI in IT & Consulting', importance: 'must', note: 'Be first to speak. Summarise at the end.' },
                        { name: 'GD Topic: WFH vs Office', importance: 'must' },
                        { name: 'Why ConsultAdd / IT Consulting?', importance: 'must', note: 'Mention their training depth and tier-2 college focus.' },
                        { name: 'Self-rating on Java (say 7–8/10, not 10)', importance: 'must' },
                        { name: 'Relocation willingness', importance: 'must' },
                    ],
                },
            ],
        },

        '.NET Developer': {
            overview: 'ConsultAdd .NET process: Aptitude → GD → 2 Technical Rounds (C#/.NET + DSA) → HR. Strong in C# fundamentals, ASP.NET Core, Entity Framework, and SQL Server.',
            lastUpdated: '2024',
            topics: [
                {
                    id: 'csharp', name: 'C# & .NET Fundamentals', icon: '🔷', prepHours: 35, importance: 'must',
                    subtopics: [
                        { name: 'OOP in C# — classes, interfaces, abstract classes', importance: 'must' },
                        { name: 'Properties, Indexers, Delegates & Events', importance: 'must' },
                        { name: 'LINQ — Where, Select, GroupBy, FirstOrDefault', importance: 'must', note: 'Practically equivalent to Java Streams — very common in .NET interviews.' },
                        { name: 'Async/Await — Task, async methods', importance: 'must' },
                        { name: 'IDisposable & using statement (resource management)', importance: 'good' },
                        { name: 'Generics — List<T>, Dictionary<K,V>', importance: 'must' },
                        { name: 'Exception handling in C#', importance: 'must' },
                        { name: 'Value types vs Reference types', importance: 'good' },
                        { name: 'Nullable types', importance: 'good' },
                    ],
                },
                {
                    id: 'aspnet', name: 'ASP.NET Core', icon: '🌐', prepHours: 15, importance: 'must',
                    subtopics: [
                        { name: 'MVC pattern — Controllers, Views, Models', importance: 'must' },
                        { name: 'Web API — REST endpoints with [HttpGet/Post/Put/Delete]', importance: 'must' },
                        { name: 'Dependency Injection (built-in .NET DI)', importance: 'must' },
                        { name: 'Middleware pipeline', importance: 'good' },
                        { name: 'Entity Framework Core — Code First, migrations', importance: 'good' },
                    ],
                },
                {
                    id: 'dsa_dotnet', name: 'Data Structures & Algorithms', icon: '🌲', prepHours: 22, importance: 'must',
                    subtopics: [
                        { name: 'Arrays & Strings (C# syntax)', importance: 'must' },
                        { name: 'Collections — List, Dictionary, Stack, Queue', importance: 'must' },
                        { name: 'Sorting & Searching', importance: 'must' },
                        { name: 'Linked List operations', importance: 'good' },
                        { name: 'Binary Search', importance: 'good' },
                    ],
                },
                {
                    id: 'db_dotnet', name: 'SQL Server & Database', icon: '🗄️', prepHours: 10, importance: 'must',
                    subtopics: [
                        { name: 'SQL Server specific syntax — TOP, NOLOCK basics', importance: 'must' },
                        { name: 'Joins, GROUP BY, HAVING', importance: 'must' },
                        { name: 'Stored Procedures & Triggers', importance: 'good' },
                        { name: 'DBMS — ACID, Normalization', importance: 'good' },
                    ],
                },
                {
                    id: 'gd_hr_dotnet', name: 'GD + HR Round', icon: '🗣️', prepHours: 8, importance: 'must',
                    subtopics: [
                        { name: 'GD Topic: .NET vs Java in Enterprise', importance: 'must', note: 'Stay balanced, mention both use cases.' },
                        { name: 'GD Topic: Cloud migration challenges', importance: 'good' },
                        { name: 'Why ConsultAdd?', importance: 'must' },
                        { name: 'Self-rating on C# / .NET (7–8/10)', importance: 'must' },
                        { name: 'Relocation willingness', importance: 'must' },
                    ],
                },
            ],
        },
    },

    // ── Deqode ────────────────────────────────────────────────────────────────
    deqode: {
        'Full Stack Developer': {
            overview: 'Deqode Full Stack process: Technical round (React + Node + DB) → HR. Focus on real-world project experience, system design thinking, and modern full-stack architecture.',
            lastUpdated: '2024',
            topics: [
                {
                    id: 'react', name: 'React & Frontend', icon: '⚛️', prepHours: 20, importance: 'must',
                    subtopics: [
                        { name: 'Component lifecycle — functional + hooks', importance: 'must' },
                        { name: 'useState, useEffect, useContext, useMemo, useCallback', importance: 'must', note: 'Know WHEN to use each, not just how.' },
                        { name: 'React Router — nested routes, params, lazy loading', importance: 'must' },
                        { name: 'State management — Context API vs Redux Toolkit', importance: 'must' },
                        { name: 'Performance — memo, virtual DOM concept, code splitting', importance: 'good' },
                        { name: 'Testing — React Testing Library basics', importance: 'optional' },
                    ],
                },
                {
                    id: 'node', name: 'Node.js & Backend', icon: '🟢', prepHours: 20, importance: 'must',
                    subtopics: [
                        { name: 'Express.js — routing, middleware, error handling', importance: 'must' },
                        { name: 'REST API design — proper status codes, versioning', importance: 'must' },
                        { name: 'Authentication — JWT, bcrypt, OAuth2 basics', importance: 'must' },
                        { name: 'Async Node — Promises, async/await, event loop', importance: 'must' },
                        { name: 'Environment variables & config management', importance: 'good' },
                        { name: 'WebSockets / Socket.io basics', importance: 'optional' },
                    ],
                },
                {
                    id: 'db_fs', name: 'Databases', icon: '🗃️', prepHours: 12, importance: 'must',
                    subtopics: [
                        { name: 'MongoDB — CRUD, aggregation pipelines, indexes', importance: 'must' },
                        { name: 'SQL — Joins, GROUP BY, subqueries (basic)', importance: 'must' },
                        { name: 'SQL vs NoSQL trade-offs', importance: 'must', note: 'Know when to choose which — common system design Q.' },
                        { name: 'Mongoose ODM basics', importance: 'good' },
                        { name: 'Redis caching basics', importance: 'optional' },
                    ],
                },
                {
                    id: 'system_design_fs', name: 'System Design & Architecture', icon: '🏗️', prepHours: 10, importance: 'must',
                    subtopics: [
                        { name: 'Monolith vs Microservices trade-offs', importance: 'must' },
                        { name: 'REST vs GraphQL basics', importance: 'must' },
                        { name: 'Caching strategies (CDN, browser, server-side)', importance: 'good' },
                        { name: 'Load balancing & horizontal scaling concept', importance: 'good' },
                        { name: 'CI/CD pipeline — GitHub Actions basics', importance: 'optional' },
                    ],
                },
                {
                    id: 'hr_fs', name: 'HR Round', icon: '🤝', prepHours: 4, importance: 'must',
                    subtopics: [
                        { name: 'Walk through your best full-stack project', importance: 'must', note: 'Have architecture diagram or deployed URL ready.' },
                        { name: 'Why Deqode / product-first companies?', importance: 'must' },
                        { name: 'How you stay updated with tech', importance: 'good' },
                    ],
                },
            ],
        },

        'React Developer': {
            overview: 'Deqode React Developer: Deep-dive Technical (React internals + JS + frontend architecture) → HR. Emphasis on production-grade code quality, performance, and real project experience.',
            lastUpdated: '2024',
            topics: [
                {
                    id: 'react_adv', name: 'Advanced React', icon: '⚛️', prepHours: 30, importance: 'must',
                    subtopics: [
                        { name: 'Custom hooks — building reusable stateful logic', importance: 'must' },
                        { name: 'React.memo, useMemo, useCallback — when & why', importance: 'must', note: 'Premature optimization vs real optimization — be honest about it.' },
                        { name: 'Context API — avoiding prop drilling', importance: 'must' },
                        { name: 'Render patterns — HOC, Renderprops, Compound components', importance: 'must' },
                        { name: 'Lazy loading & React.Suspense', importance: 'must' },
                        { name: 'Error Boundaries', importance: 'good' },
                        { name: 'React 18 features — useTransition, useDeferredValue', importance: 'good' },
                        { name: 'Server Components basics (Next.js 14)', importance: 'optional' },
                    ],
                },
                {
                    id: 'js_deep', name: 'JavaScript Fundamentals (deep)', icon: '🟨', prepHours: 20, importance: 'must',
                    subtopics: [
                        { name: 'Closure — real-world use cases', importance: 'must' },
                        { name: 'this keyword — explicit vs implicit binding', importance: 'must' },
                        { name: 'Prototypal inheritance', importance: 'must' },
                        { name: 'Event Loop — task queue, microtask queue', importance: 'must', note: 'Very common at product companies — draw the call stack.' },
                        { name: 'ES6+ — destructuring, spread/rest, optional chaining', importance: 'must' },
                        { name: 'Promise internals & async/await under the hood', importance: 'good' },
                        { name: 'WeakMap & WeakRef for memory management', importance: 'optional' },
                    ],
                },
                {
                    id: 'state_mgmt', name: 'State Management', icon: '🔄', prepHours: 12, importance: 'must',
                    subtopics: [
                        { name: 'Redux Toolkit — slices, thunks, selectors', importance: 'must' },
                        { name: 'Zustand / Jotai basics', importance: 'good' },
                        { name: 'React Query — server state, caching, invalidation', importance: 'must', note: 'Know the difference between client state and server state.' },
                        { name: 'When to lift state vs use context', importance: 'must' },
                    ],
                },
                {
                    id: 'perf_css', name: 'Performance & CSS', icon: '🎨', prepHours: 10, importance: 'must',
                    subtopics: [
                        { name: 'Core Web Vitals — LCP, CLS, FID/INP', importance: 'must' },
                        { name: 'Bundle analysis — code splitting, tree shaking', importance: 'must' },
                        { name: 'CSS-in-JS vs CSS Modules vs Tailwind trade-offs', importance: 'good' },
                        { name: 'Responsive design — Flexbox + Grid mastery', importance: 'good' },
                    ],
                },
                {
                    id: 'hr_react', name: 'HR Round', icon: '🤝', prepHours: 4, importance: 'must',
                    subtopics: [
                        { name: 'Demo your best React project (have it deployed)', importance: 'must' },
                        { name: 'Why specialise in frontend?', importance: 'must' },
                        { name: 'How you handle browser compatibility issues', importance: 'good' },
                    ],
                },
            ],
        },
    },
};

/**
 * Get the best rich syllabus for a given role.
 * Tries: ROLE_SYLLABI exact → case-insensitive → word-inclusion → company-level
 * @param {string} companySlug
 * @param {string} roleName
 * @returns {object|null}
 */
export function getRoleSyllabus(companySlug, roleName) {
    const companyRoles = ROLE_SYLLABI[companySlug];
    if (!companyRoles || !roleName) return SYLLABI[companySlug] || null;

    // 1. Exact match
    if (companyRoles[roleName]) return companyRoles[roleName];

    const lower = roleName.toLowerCase();

    // 2. Case-insensitive exact
    for (const [key, val] of Object.entries(companyRoles)) {
        if (key.toLowerCase() === lower) return val;
    }

    // 3. Substring / word match
    for (const [key, val] of Object.entries(companyRoles)) {
        if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return val;
    }

    // 4. Fallback to company-level static
    return SYLLABI[companySlug] || null;
}

/**
 * Importance metadata for UI rendering
 */
export const IMPORTANCE_META = {
    must: {
        label: 'Must Know',
        color: 'var(--danger)',
        bg: 'rgba(239,68,68,0.1)',
        border: 'rgba(239,68,68,0.25)',
        priority: 1,
    },
    good: {
        label: 'Good to Know',
        color: 'var(--accent)',
        bg: 'rgba(245,158,11,0.1)',
        border: 'rgba(245,158,11,0.25)',
        priority: 2,
    },
    optional: {
        label: 'Optional',
        color: 'var(--text-muted)',
        bg: 'rgba(255,255,255,0.04)',
        border: 'var(--border)',
        priority: 3,
    },
};
