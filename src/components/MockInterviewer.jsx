'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, User, Bot, Loader2 } from 'lucide-react';
import styles from './MockInterviewer.module.css';

export default function MockInterviewer({ companyName }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const startInterview = async () => {
        setIsOpen(true);
        if (messages.length === 0) {
            setIsLoading(true);
            try {
                // Trigger the initial AI greeting
                const res = await fetch('/api/interview-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: [], companyName })
                });
                const data = await res.json();
                if (data.reply) {
                    setMessages([{ role: 'assistant', content: data.reply }]);
                }
            } catch (err) {
                console.error("Failed to start chat:", err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input.trim() };
        const newMessages = [...messages, userMsg];

        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/interview-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages, companyName })
            });
            const data = await res.json();

            if (data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error." }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Network error occurred." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.widgetContainer}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.chatWindow}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className={styles.header}>
                            <div className={styles.headerInfo}>
                                <div className={styles.avatar}><Bot size={18} /></div>
                                <div>
                                    <h4>{companyName} Interviewer</h4>
                                    <span className={styles.status}>AI actively listening</span>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.messages}>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userWrapper : styles.aiWrapper}`}
                                >
                                    {msg.role === 'assistant' && <div className={styles.msgAvatar}><Bot size={14} /></div>}
                                    <div className={`${styles.message} ${msg.role === 'user' ? styles.userMsg : styles.aiMsg}`}>
                                        {msg.content}
                                    </div>
                                    {msg.role === 'user' && <div className={styles.msgAvatar}><User size={14} /></div>}
                                </motion.div>
                            ))}

                            {isLoading && (
                                <div className={`${styles.messageWrapper} ${styles.aiWrapper}`}>
                                    <div className={styles.msgAvatar}><Bot size={14} /></div>
                                    <div className={`${styles.message} ${styles.aiMsg} ${styles.loadingMsg}`}>
                                        <Loader2 size={16} className={styles.spinner} /> Typing...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className={styles.inputArea}>
                            <input
                                type="text"
                                placeholder="Type your answer..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                                className={styles.input}
                            />
                            <button type="submit" disabled={!input.trim() || isLoading} className={styles.sendBtn}>
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <motion.button
                    className={styles.fabBtn}
                    onClick={startInterview}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.5 }}
                >
                    <MessageSquare size={24} />
                    <span className={styles.fabText}>Mock Interview</span>
                </motion.button>
            )}
        </div>
    );
}
