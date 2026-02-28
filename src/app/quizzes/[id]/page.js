'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, ArrowLeft, Clock, CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import styles from './page.module.css';

export default function QuizTakingPage() {
    const { id } = useParams();
    const router = useRouter();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        fetch(`/api/quizzes/${id}`)
            .then(res => res.json())
            .then(data => { setQuiz(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) return <div className={styles.loading}>Loading quiz...</div>;
    if (!quiz || !quiz.questions?.length) return (
        <div className={styles.loading}>
            <h2>Quiz not found</h2>
            <Link href="/quizzes" className={styles.backLink}><ArrowLeft size={16} /> Back to Quizzes</Link>
        </div>
    );

    const handleSelectOption = (index) => {
        if (isFinished) return;
        setAnswers({ ...answers, [currentQuestion]: index });
    };

    const handleNext = () => {
        if (currentQuestion < quiz.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmit = () => {
        let newScore = 0;
        quiz.questions.forEach((q, i) => {
            if (answers[i] === q.correctAnswer) newScore++;
        });
        setScore(newScore);
        setIsFinished(true);
    };

    const handleRestart = () => {
        setAnswers({});
        setCurrentQuestion(0);
        setIsFinished(false);
        setScore(0);
    };

    const q = quiz.questions[currentQuestion];
    const isAnswered = answers[currentQuestion] !== undefined;
    const isLastQuestion = currentQuestion === quiz.questions.length - 1;

    if (isFinished) {
        const percentage = Math.round((score / quiz.questions.length) * 100);

        return (
            <div className={styles.page}>
                <div className="container">
                    <div className={styles.resultCard}>
                        <div className={styles.scoreCircle}>
                            <svg viewBox="0 0 36 36" className={styles.circularChart}>
                                <path className={styles.circleBg} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className={styles.circle} strokeDasharray={`${percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <text x="18" y="20.35" className={styles.percentage}>{percentage}%</text>
                            </svg>
                        </div>

                        <h2>Quiz Completed!</h2>
                        <p>You scored <strong>{score}</strong> out of <strong>{quiz.questions.length}</strong>.</p>

                        <div className={styles.resultActions}>
                            <button onClick={handleRestart} className={styles.btnSecondary}><RotateCcw size={16} /> Retry Quiz</button>
                            <Link href="/quizzes" className={styles.btnPrimary}><Brain size={16} /> Try Another</Link>
                        </div>
                    </div>

                    <div className={styles.solutions}>
                        <h3 className={styles.solutionsTitle}>Detailed Solutions</h3>
                        {quiz.questions.map((question, i) => {
                            const userAnswer = answers[i];
                            const isCorrect = userAnswer === question.correctAnswer;

                            return (
                                <div key={i} className={`${styles.solutionItem} ${isCorrect ? styles.correct : styles.incorrect}`}>
                                    <div className={styles.solutionHeader}>
                                        <span className={styles.qNum}>Q{i + 1}</span>
                                        {isCorrect ? <CheckCircle2 className={styles.iconCorrect} size={20} /> : <XCircle className={styles.iconIncorrect} size={20} />}
                                    </div>
                                    <p className={styles.solutionText}>{question.questionText}</p>
                                    <div className={styles.solutionOptions}>
                                        {question.options.map((opt, optIdx) => (
                                            <div key={optIdx} className={`
                        ${styles.solOption} 
                        ${optIdx === question.correctAnswer ? styles.solRight : ''}
                        ${optIdx === userAnswer && !isCorrect ? styles.solWrong : ''}
                      `}>
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                    {question.explanation && (
                                        <div className={styles.explanation}>
                                            <strong>Explanation:</strong> {question.explanation}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className="container">
                    <Link href="/quizzes" className={styles.backLink}><ArrowLeft size={16} /> Exit Quiz</Link>
                    <div className={styles.quizHeader}>
                        <div>
                            <span className={styles.badge}>{quiz.category}</span>
                            <h1>{quiz.title}</h1>
                        </div>
                        <div className={styles.timer}>
                            <Clock size={20} />
                            <span>Question {currentQuestion + 1}/{quiz.questions.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <div className={styles.quizViewer}>
                    <div className={styles.progressBox}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${((currentQuestion) / quiz.questions.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className={styles.questionBox}>
                        <h2 className={styles.questionText}>
                            <span className={styles.qNum}>Q{currentQuestion + 1}.</span> {q.questionText}
                        </h2>

                        <div className={styles.options}>
                            {q.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    className={`${styles.optionBtn} ${answers[currentQuestion] === idx ? styles.selectedOption : ''}`}
                                    onClick={() => handleSelectOption(idx)}
                                >
                                    <span className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                                    <span className={styles.optionText}>{option}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.controls}>
                        <button
                            className={styles.btnNav}
                            onClick={handlePrev}
                            disabled={currentQuestion === 0}
                        >
                            Previous
                        </button>

                        {isLastQuestion ? (
                            <button
                                className={styles.btnSubmit}
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length < quiz.questions.length}
                            >
                                Submit Quiz
                            </button>
                        ) : (
                            <button
                                className={styles.btnNext}
                                onClick={handleNext}
                                disabled={!isAnswered}
                            >
                                Next <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.statusBox}>
                    <p>Answered: <strong>{Object.keys(answers).length}</strong> / {quiz.questions.length}</p>
                </div>
            </div>
        </div>
    );
}
