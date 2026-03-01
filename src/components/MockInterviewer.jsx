'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, User, Bot, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import styles from './MockInterviewer.module.css';

export default function MockInterviewer({ companyName }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Audio Features State
    const [isListening, setIsListening] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const recognitionRef = useRef(null);
    const synthRef = useRef(null);
    const baseInputRef = useRef('');

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Initialize Web Speech APIs
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event) => {
                    let currentTranscript = '';
                    for (let i = 0; i < event.results.length; ++i) {
                        currentTranscript += event.results[i][0].transcript;
                    }
                    const separator = baseInputRef.current && currentTranscript.trim() ? ' ' : '';
                    setInput(baseInputRef.current + separator + currentTranscript);
                };

                recognition.onerror = (event) => {
                    console.error("Speech recognition error", event.error);
                    setIsListening(false);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            }

            if ('speechSynthesis' in window) {
                synthRef.current = window.speechSynthesis;
            }
        }
    }, []);

    const speak = (text) => {
        if (!synthRef.current || isMuted) return;

        // Cancel any ongoing speech
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a good English voice
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB') || voices[0];

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        synthRef.current.speak(utterance);
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Your browser does not support Speech Recognition.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            baseInputRef.current = input; // Capture existing input before starting
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                // Ignore 'already started' errors
            }
        }
    };

    const toggleMute = () => {
        if (!isMuted && synthRef.current) {
            synthRef.current.cancel(); // Stop speaking immediately if muting
        }
        setIsMuted(!isMuted);
    };

    const startInterview = async () => {
        setIsOpen(true);
        if (messages.length === 0) {
            setIsLoading(true);
            try {
                const res = await fetch('/api/interview-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: [], companyName })
                });
                const data = await res.json();
                if (data.reply) {
                    setMessages([{ role: 'assistant', content: data.reply }]);
                    speak(data.reply);
                }
            } catch (err) {
                console.error("Failed to start chat:", err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const sendMessage = async (e) => {
        if (e) e.preventDefault();

        // Force stop listening if user submits manually
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
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
                speak(data.reply);
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
                            <div className={styles.headerActions}>
                                <button
                                    onClick={toggleMute}
                                    className={`${styles.actionBtn} ${isMuted ? styles.muted : ''}`}
                                    title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
                                >
                                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className={styles.actionBtn}>
                                    <X size={20} />
                                </button>
                            </div>
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
                            <motion.button
                                type="button"
                                onClick={toggleListening}
                                className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}
                                animate={isListening ? { scale: [1, 1.1, 1], boxShadow: ["0px 0px 0px 0px rgba(16, 185, 129, 0)", "0px 0px 0px 10px rgba(16, 185, 129, 0.3)", "0px 0px 0px 0px rgba(16, 185, 129, 0)"] } : {}}
                                transition={isListening ? { duration: 1.5, repeat: Infinity } : {}}
                                title="Use Microphone"
                            >
                                {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                            </motion.button>
                            <input
                                type="text"
                                placeholder={isListening ? "Listening..." : "Type your answer..."}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading || isListening}
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
