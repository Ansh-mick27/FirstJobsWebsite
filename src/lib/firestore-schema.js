/**
 * @fileoverview Firestore Data Model — PlacePrep
 *
 * This file is the AUTHORITATIVE reference for all Firestore collections
 * and document shapes. API routes must conform to this schema.
 *
 * Firestore does not enforce schemas — this is documentation + JSDoc only.
 * All server-side writes use firebase-admin (adminDb).
 * All client-side reads use the firebase client SDK (db).
 */

// ---------------------------------------------------------------------------
// /companies/{companyId}
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Company
 * @property {string}   id            - Firestore auto-generated document ID
 * @property {string}   name          - Display name (e.g. "Infosys")
 * @property {string}   slug          - URL-safe unique identifier (e.g. "infosys")
 * @property {string|null} logo       - Firebase Storage download URL or null
 * @property {string}   industry      - e.g. "IT Services", "Product", "BFSI"
 * @property {string}   description   - Markdown-supported company description
 * @property {"Active"|"Inactive"} hiringStatus
 * @property {{ oa: boolean, technical: boolean, hr: boolean }} rounds
 * @property {string[]} tags          - e.g. ["mass-recruiter", "product", "service"]
 * @property {import('firebase-admin/firestore').Timestamp} createdAt
 */

// ---------------------------------------------------------------------------
// /companies/{companyId}/questions/{questionId}
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Question
 * @property {string}         id            - Firestore auto-generated document ID
 * @property {string}         text          - Question content (markdown supported)
 * @property {"mcq"|"coding"|"subjective"} type
 * @property {"oa"|"technical"|"hr"}       round
 * @property {number}         year          - Year the PYQ appeared (e.g. 2024)
 * @property {"Easy"|"Medium"|"Hard"}      difficulty
 * @property {string[]}       tags          - Topic tags (e.g. ["arrays", "dp"])
 *
 * // ---- MCQ fields (null for coding/subjective) ----
 * @property {string[]|null}  options       - Array of 4 answer choices
 * @property {number|null}    correctAnswer - 0-based index of correct option
 * @property {string|null}    explanation   - Brief explanation of correct answer
 *
 * // ---- Coding fields (null for mcq/subjective) ----
 * @property {{ [language: string]: string }|null} starterCode
 * @property {string|null}    solution      - Reference solution code
 * @property {{ input: string, output: string, isHidden: boolean }[]|null} testCases
 *
 * @property {import('firebase-admin/firestore').Timestamp} createdAt
 */

// ---------------------------------------------------------------------------
// /users/{userId}
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} UserProfile
 * @property {string} uid        - Matches Firebase Auth UID
 * @property {string} email
 * @property {string} name
 * @property {string} rollNo
 * @property {import('firebase-admin/firestore').Timestamp} createdAt
 * @property {import('firebase-admin/firestore').Timestamp} lastActive
 */

// ---------------------------------------------------------------------------
// /users/{userId}/testAttempts/{attemptId}
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} TestAttempt
 * @property {string}  companyId
 * @property {string}  companyName
 * @property {string}  companySlug
 * @property {"oa"|"technical"} roundType
 * @property {number}  score           - Correct answers count
 * @property {number}  totalQuestions
 * @property {number}  timeTaken       - Seconds taken to complete
 * @property {{ [questionId: string]: number|string }} answers - User's selected answers
 * @property {import('firebase-admin/firestore').Timestamp} completedAt
 */

// ---------------------------------------------------------------------------
// /users/{userId}/interviewSessions/{sessionId}
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} InterviewMessage
 * @property {"user"|"assistant"} role
 * @property {string}  content
 * @property {import('firebase-admin/firestore').Timestamp} timestamp
 */

/**
 * @typedef {Object} AIFeedback
 * @property {number}   score          - Out of 10
 * @property {string[]} strengths
 * @property {string[]} weaknesses
 * @property {string[]} suggestions
 * @property {string}   overallSummary
 */

/**
 * @typedef {Object} InterviewSession
 * @property {string}  companyId
 * @property {string}  companyName
 * @property {string}  companySlug
 * @property {"hr"|"technical"} roundType
 * @property {InterviewMessage[]} messages
 * @property {AIFeedback|null} aiFeedback
 * @property {boolean} isComplete
 * @property {import('firebase-admin/firestore').Timestamp|null} completedAt
 * @property {import('firebase-admin/firestore').Timestamp} startedAt
 */

// ---------------------------------------------------------------------------
// Collection path helpers
// ---------------------------------------------------------------------------

export const COLLECTIONS = {
    companies: 'companies',
    /** @param {string} companyId */
    questions: (companyId) => `companies/${companyId}/questions`,
    users: 'users',
    /** @param {string} userId */
    testAttempts: (userId) => `users/${userId}/testAttempts`,
    /** @param {string} userId */
    interviewSessions: (userId) => `users/${userId}/interviewSessions`,
};
