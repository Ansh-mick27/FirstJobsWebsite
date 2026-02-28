require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Seed Companies
    const companies = await Promise.all([
        prisma.company.upsert({
            where: { slug: 'tcs' },
            update: {},
            create: {
                name: 'Tata Consultancy Services',
                slug: 'tcs',
                logo: 'https://logo.clearbit.com/tcs.com',
                industry: 'IT Services',
                description: 'TCS is an Indian multinational IT services and consulting company. It is part of the Tata Group and operates in 150 locations across 46 countries. TCS is one of the largest employers in the Indian IT sector.',
                website: 'https://www.tcs.com',
                size: '600,000+',
                hiringStatus: 'Active',
            },
        }),
        prisma.company.upsert({
            where: { slug: 'infosys' },
            update: {},
            create: {
                name: 'Infosys',
                slug: 'infosys',
                logo: 'https://logo.clearbit.com/infosys.com',
                industry: 'IT Services',
                description: 'Infosys Limited is an Indian multinational corporation that provides business consulting, information technology, and outsourcing services. Founded in 1981, it is the second-largest Indian IT company.',
                website: 'https://www.infosys.com',
                size: '300,000+',
                hiringStatus: 'Active',
            },
        }),
        prisma.company.upsert({
            where: { slug: 'wipro' },
            update: {},
            create: {
                name: 'Wipro',
                slug: 'wipro',
                logo: 'https://logo.clearbit.com/wipro.com',
                industry: 'IT Services',
                description: 'Wipro Limited is an Indian multinational IT, consulting, and business process services corporation. It is one of the leading global IT companies.',
                website: 'https://www.wipro.com',
                size: '250,000+',
                hiringStatus: 'Active',
            },
        }),
        prisma.company.upsert({
            where: { slug: 'google' },
            update: {},
            create: {
                name: 'Google',
                slug: 'google',
                logo: 'https://logo.clearbit.com/google.com',
                industry: 'Technology',
                description: 'Google LLC is an American multinational technology company focusing on AI, online advertising, search engine technology, and cloud computing.',
                website: 'https://www.google.com',
                size: '180,000+',
                hiringStatus: 'Active',
            },
        }),
        prisma.company.upsert({
            where: { slug: 'microsoft' },
            update: {},
            create: {
                name: 'Microsoft',
                slug: 'microsoft',
                logo: 'https://logo.clearbit.com/microsoft.com',
                industry: 'Technology',
                description: 'Microsoft Corporation produces computer software, consumer electronics, and personal computers. Known for Windows, Azure, and Office suite.',
                website: 'https://www.microsoft.com',
                size: '220,000+',
                hiringStatus: 'Active',
            },
        }),
        prisma.company.upsert({
            where: { slug: 'amazon' },
            update: {},
            create: {
                name: 'Amazon',
                slug: 'amazon',
                logo: 'https://logo.clearbit.com/amazon.com',
                industry: 'E-commerce & Cloud',
                description: 'Amazon is an American multinational technology company focusing on e-commerce, cloud computing (AWS), digital streaming, and artificial intelligence.',
                website: 'https://www.amazon.com',
                size: '1,500,000+',
                hiringStatus: 'Active',
            },
        }),
        prisma.company.upsert({
            where: { slug: 'cognizant' },
            update: {},
            create: {
                name: 'Cognizant',
                slug: 'cognizant',
                logo: 'https://logo.clearbit.com/cognizant.com',
                industry: 'IT Services',
                description: 'Cognizant provides digital, technology, consulting, and operations services across various industries worldwide.',
                website: 'https://www.cognizant.com',
                size: '350,000+',
                hiringStatus: 'Active',
            },
        }),
        prisma.company.upsert({
            where: { slug: 'accenture' },
            update: {},
            create: {
                name: 'Accenture',
                slug: 'accenture',
                logo: 'https://logo.clearbit.com/accenture.com',
                industry: 'Consulting & IT',
                description: 'Accenture is a multinational professional services company specializing in IT services and consulting. A Fortune Global 500 company.',
                website: 'https://www.accenture.com',
                size: '738,000+',
                hiringStatus: 'Active',
            },
        }),
        prisma.company.upsert({
            where: { slug: 'hcl' },
            update: {},
            create: {
                name: 'HCL Technologies',
                slug: 'hcl',
                logo: 'https://logo.clearbit.com/hcltech.com',
                industry: 'IT Services',
                description: 'HCL Technologies is the third-largest Indian IT services company by revenue, focusing on digital, cloud, and IoT services.',
                website: 'https://www.hcltech.com',
                size: '220,000+',
                hiringStatus: 'Active',
            },
        }),
        prisma.company.upsert({
            where: { slug: 'deloitte' },
            update: {},
            create: {
                name: 'Deloitte',
                slug: 'deloitte',
                logo: 'https://logo.clearbit.com/deloitte.com',
                industry: 'Consulting',
                description: 'Deloitte is one of the Big Four accounting organizations and the largest professional services network in the world by revenue.',
                website: 'https://www.deloitte.com',
                size: '415,000+',
                hiringStatus: 'Active',
            },
        }),
        prisma.company.upsert({
            where: { slug: 'ibm' },
            update: {},
            create: {
                name: 'IBM',
                slug: 'ibm',
                logo: 'https://logo.clearbit.com/ibm.com',
                industry: 'Technology',
                description: 'IBM specializes in computer hardware, middleware, software, hosting and consulting services.',
                website: 'https://www.ibm.com',
                size: '280,000+',
                hiringStatus: 'Active',
            },
        }),
        prisma.company.upsert({
            where: { slug: 'oracle' },
            update: {},
            create: {
                name: 'Oracle',
                slug: 'oracle',
                logo: 'https://logo.clearbit.com/oracle.com',
                industry: 'Technology',
                description: 'Oracle Corporation specializes in database software, cloud engineered systems, and enterprise software products.',
                website: 'https://www.oracle.com',
                size: '143,000+',
                hiringStatus: 'Active',
            },
        }),
    ]);

    console.log(`✅ Seeded ${companies.length} companies`);

    // Seed quizzes
    const quizCategories = [
        { title: 'Aptitude Fundamentals', category: 'Aptitude', difficulty: 'Easy' },
        { title: 'Logical Reasoning Practice', category: 'Logical Reasoning', difficulty: 'Medium' },
        { title: 'Verbal Ability Test', category: 'Verbal Ability', difficulty: 'Medium' },
        { title: 'Coding & DSA Basics', category: 'Coding', difficulty: 'Medium' },
        { title: 'General Knowledge', category: 'General Knowledge', difficulty: 'Easy' },
        { title: 'TCS NQT Practice', category: 'Company-Specific', difficulty: 'Medium' },
    ];

    const questionSets = {
        'Aptitude': [
            { questionText: 'If a train travels 360 km in 4 hours, what is its speed?', options: ['80 km/h', '90 km/h', '85 km/h', '95 km/h'], correctAnswer: 1, explanation: 'Speed = Distance/Time = 360/4 = 90 km/h' },
            { questionText: 'What is 25% of 480?', options: ['100', '120', '140', '160'], correctAnswer: 1, explanation: '25% of 480 = (25/100) × 480 = 120' },
            { questionText: 'A man buys an article for ₹500 and sells for ₹600. Profit %?', options: ['10%', '15%', '20%', '25%'], correctAnswer: 2, explanation: 'Profit% = (100/500) × 100 = 20%' },
            { questionText: 'Ratio of boys:girls is 3:4. If 28 students, how many boys?', options: ['10', '12', '14', '16'], correctAnswer: 1, explanation: 'Boys = (3/7) × 28 = 12' },
            { questionText: 'Simple interest on ₹1000 for 2 years is ₹200. Rate?', options: ['8%', '10%', '12%', '15%'], correctAnswer: 1, explanation: 'R = (200×100)/(1000×2) = 10%' },
        ],
        'Logical Reasoning': [
            { questionText: 'Next in series: 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '46'], correctAnswer: 1, explanation: 'Differences: 4, 6, 8, 10, 12. Next = 30+12 = 42' },
            { questionText: 'If COMPUTER=DPNQVUFS, MOBILE=?', options: ['NPCJMF', 'NPCKNG', 'NPCJMG', 'NPCKME'], correctAnswer: 0, explanation: 'Each letter +1' },
            { questionText: 'Ravi is 7th from left, 12th from right. Total boys?', options: ['17', '18', '19', '20'], correctAnswer: 1, explanation: '7+12-1 = 18' },
            { questionText: 'All Zips are Zaps, all Zaps are Zops. True?', options: ['All Zops are Zips', 'All Zips are Zops', 'All Zaps are Zips', 'None'], correctAnswer: 1, explanation: 'Transitive: Zips ⊂ Zaps ⊂ Zops' },
            { questionText: 'Next: J, F, M, A, M, J, J, ?', options: ['A', 'S', 'O', 'N'], correctAnswer: 0, explanation: 'First letters of months → August (A)' },
        ],
        'Verbal Ability': [
            { questionText: 'Synonym of "Ubiquitous":', options: ['Rare', 'Omnipresent', 'Hidden', 'Unique'], correctAnswer: 1, explanation: 'Ubiquitous = present everywhere = omnipresent' },
            { questionText: 'Antonym of "Benevolent":', options: ['Kind', 'Generous', 'Malevolent', 'Gracious'], correctAnswer: 2, explanation: 'Benevolent (kind) ↔ Malevolent (wishing harm)' },
            { questionText: 'Error in: "He don\'t know the answer."', options: ['He', 'don\'t', 'know', 'answer'], correctAnswer: 1, explanation: 'Should be "doesn\'t" for 3rd person singular' },
            { questionText: 'Fill: "She is _____ honest girl."', options: ['a', 'an', 'the', 'no article'], correctAnswer: 1, explanation: 'Honest has vowel sound → use "an"' },
            { questionText: '"Break the ice" means:', options: ['Break something', 'Start a conversation', 'Freeze water', 'End relationship'], correctAnswer: 1, explanation: 'Idiom: initiate conversation in social setting' },
        ],
        'Coding': [
            { questionText: 'Time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctAnswer: 1, explanation: 'Divides search space by half → O(log n)' },
            { questionText: 'LIFO data structure?', options: ['Queue', 'Stack', 'Array', 'Linked List'], correctAnswer: 1, explanation: 'Stack = Last In First Out' },
            { questionText: 'typeof null in JavaScript?', options: ['"null"', '"undefined"', '"object"', '"number"'], correctAnswer: 2, explanation: 'typeof null returns "object" — a known JS bug' },
            { questionText: 'Best avg-case sorting algorithm?', options: ['Bubble', 'Merge', 'Selection', 'Insertion'], correctAnswer: 1, explanation: 'Merge Sort = O(n log n)' },
            { questionText: 'Space complexity of recursive Fibonacci?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(2^n)'], correctAnswer: 1, explanation: 'Call stack depth = n → O(n)' },
        ],
        'General Knowledge': [
            { questionText: 'Bill Gates founded?', options: ['Apple', 'Google', 'Microsoft', 'Amazon'], correctAnswer: 2, explanation: 'Bill Gates co-founded Microsoft in 1975' },
            { questionText: 'CEO stands for?', options: ['Chief Executive Officer', 'Chief Engineering Officer', 'Central Executive Office', 'Chief Education Officer'], correctAnswer: 0, explanation: 'CEO = Chief Executive Officer' },
            { questionText: 'NASDAQ is based in?', options: ['London', 'Tokyo', 'New York', 'Mumbai'], correctAnswer: 2, explanation: 'NASDAQ is in New York City' },
            { questionText: 'James Gosling created?', options: ['Python', 'C++', 'Java', 'JavaScript'], correctAnswer: 2, explanation: 'Java was created by Gosling at Sun in 1995' },
            { questionText: 'First iPhone released in?', options: ['2005', '2006', '2007', '2008'], correctAnswer: 2, explanation: 'Apple released first iPhone in 2007' },
        ],
        'Company-Specific': [
            { questionText: 'TCS NQT stands for?', options: ['National Qualifier Test', 'New Quality Test', 'National Quality Test', 'New Qualifier Test'], correctAnswer: 0, explanation: 'TCS NQT = National Qualifier Test' },
            { questionText: 'Which is NOT in TCS NQT?', options: ['Numerical', 'Verbal', 'Reasoning', 'General Science'], correctAnswer: 3, explanation: 'NQT has Numerical, Verbal, Reasoning + Programming Logic' },
            { questionText: 'TCS founded in?', options: ['1960', '1965', '1968', '1971'], correctAnswer: 2, explanation: 'TCS was founded April 1, 1968' },
            { questionText: 'TCS headquarters?', options: ['Delhi', 'Bangalore', 'Mumbai', 'Chennai'], correctAnswer: 2, explanation: 'TCS HQ is in Mumbai' },
            { questionText: 'TCS CEO (2024)?', options: ['N. Chandrasekaran', 'R. Gopinathan', 'K. Krithivasan', 'S. Ramadorai'], correctAnswer: 2, explanation: 'K. Krithivasan became CEO in June 2023' },
        ],
    };

    for (const cat of quizCategories) {
        const quiz = await prisma.quiz.create({
            data: {
                title: cat.title,
                category: cat.category,
                difficulty: cat.difficulty,
                companyId: cat.category === 'Company-Specific' ? companies[0].id : null,
            },
        });

        const questions = questionSets[cat.category] || questionSets['Aptitude'];
        for (const q of questions) {
            await prisma.question.create({
                data: { quizId: quiz.id, ...q },
            });
        }
    }

    console.log('✅ Seeded 6 quizzes with questions');

    // Seed papers
    const demoQuestions = [
        { id: 1, text: 'If x+y=10, x-y=4, find x.', options: ['5', '6', '7', '8'], type: 'Aptitude' },
        { id: 2, text: 'Next: 3, 9, 27, 81, ?', options: ['162', '243', '324', '729'], type: 'Aptitude' },
        { id: 3, text: 'Synonym of "Intricate":', options: ['Simple', 'Complex', 'Clear', 'Brief'], type: 'Verbal' },
        { id: 4, text: 'Output: print(2**3**2)?', options: ['64', '512', '256', '128'], type: 'Coding' },
        { id: 5, text: 'Probability of red from 6R+4B?', options: ['0.4', '0.5', '0.6', '0.7'], type: 'Aptitude' },
    ];
    const demoSolutions = [
        { id: 1, answer: 2, explanation: '2x=14 → x=7' },
        { id: 2, answer: 1, explanation: '81×3=243' },
        { id: 3, answer: 1, explanation: 'Intricate=Complex' },
        { id: 4, answer: 1, explanation: '** right-assoc: 3²=9, 2⁹=512' },
        { id: 5, answer: 2, explanation: '6/10=0.6' },
    ];

    const papers = [
        { slug: 'tcs', year: 2024, type: 'Aptitude', title: 'TCS NQT 2024 Aptitude Paper' },
        { slug: 'tcs', year: 2023, type: 'Coding', title: 'TCS NQT 2023 Coding Paper' },
        { slug: 'infosys', year: 2024, type: 'Aptitude', title: 'Infosys InfyTQ 2024 Paper' },
        { slug: 'wipro', year: 2024, type: 'Both', title: 'Wipro NLTH 2024 Complete Paper' },
        { slug: 'cognizant', year: 2024, type: 'Aptitude', title: 'Cognizant GenC 2024 Paper' },
        { slug: 'accenture', year: 2023, type: 'Both', title: 'Accenture 2023 Assessment Paper' },
    ];

    for (const p of papers) {
        const company = companies.find(c => c.slug === p.slug);
        if (company) {
            await prisma.paper.create({
                data: {
                    companyId: company.id,
                    year: p.year,
                    type: p.type,
                    title: p.title,
                    questions: demoQuestions,
                    solutions: demoSolutions,
                },
            });
        }
    }

    console.log('✅ Seeded 6 previous year papers');
    console.log('🎉 Database seeding complete!');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
