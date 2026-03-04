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
