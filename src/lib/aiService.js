import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const MODEL = 'llama-3.3-70b-versatile';

export async function generateTestimonials(companyName) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that generates realistic employee testimonials. Return a JSON array of exactly 5 testimonials. Each testimonial should have: name (realistic Indian name), role (job title at the company), content (2-3 sentences about their experience), rating (4 or 5). Return ONLY valid JSON, no markdown or extra text.'
                },
                {
                    role: 'user',
                    content: `Generate 5 realistic employee testimonials for ${companyName}. Focus on placement experience, work culture, growth opportunities, and interview process.`
                }
            ],
            model: MODEL,
            temperature: 0.8,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        });

        const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
        return response.testimonials || response.data || [];
    } catch (error) {
        console.error('Error generating testimonials:', error);
        return getFallbackTestimonials(companyName);
    }
}

export async function generateQuizQuestions(topic, difficulty = 'Medium', count = 10) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are an expert quiz creator for placement preparation. Generate exactly ${count} multiple-choice questions. Return a JSON object with a "questions" array. Each question should have: questionText (the question), options (array of exactly 4 strings), correctAnswer (0-based index of correct option), explanation (brief explanation of the answer). Return ONLY valid JSON, no markdown.`
                },
                {
                    role: 'user',
                    content: `Generate ${count} ${difficulty} difficulty ${topic} questions for campus placement preparation.`
                }
            ],
            model: MODEL,
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: 'json_object' },
        });

        const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
        return response.questions || [];
    } catch (error) {
        console.error('Error generating quiz questions:', error);
        return [];
    }
}

export async function generateInterviewQuestions(companyName, category = 'Technical') {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert interview coach. Generate exactly 10 interview questions with detailed answers. Return a JSON object with a "questions" array. Each item should have: question (the interview question), answer (detailed answer, 3-5 sentences), difficulty (Easy/Medium/Hard), category (HR/Technical/Behavioral). Return ONLY valid JSON.'
                },
                {
                    role: 'user',
                    content: `Generate 10 ${category} interview questions commonly asked at ${companyName} during campus placements. Include a mix of difficulties.`
                }
            ],
            model: MODEL,
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: 'json_object' },
        });

        const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
        return response.questions || [];
    } catch (error) {
        console.error('Error generating interview questions:', error);
        return [];
    }
}

function getFallbackTestimonials(companyName) {
    return [
        { name: 'Priya Sharma', role: 'Software Engineer', content: `Working at ${companyName} has been an incredible journey. The learning opportunities are endless and the team is very supportive.`, rating: 5 },
        { name: 'Rahul Kumar', role: 'Associate Consultant', content: `${companyName} provides excellent training for freshers. The work-life balance is great and there are many growth paths.`, rating: 4 },
        { name: 'Ananya Gupta', role: 'Systems Engineer', content: `The campus placement process at ${companyName} was smooth and well-organized. I've grown tremendously in my technical skills here.`, rating: 5 },
        { name: 'Vikash Singh', role: 'Analyst', content: `${companyName} offers a structured career path with regular promotions. The mentorship program helped me a lot in my early career.`, rating: 4 },
        { name: 'Neha Patel', role: 'Developer', content: `I joined ${companyName} through campus placement and it's been a wonderful experience. The projects are challenging and the team collaboration is excellent.`, rating: 5 },
    ];
}
