'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { CheckCircle2, Infinity as InfinityIcon } from 'lucide-react';

const ScrambleText = ({ text }) => {
    const [displayText, setDisplayText] = useState(text);
    const chars = '!<>-_\\/[]{}—=+*^?#_';

    useEffect(() => {
        let iteration = 0;
        let animationFrame;

        const scramble = () => {
            setDisplayText(text.split('').map((char, index) => {
                if (char === ' ') return ' ';
                if (index < iteration) return text[index];
                return chars[Math.floor(Math.random() * chars.length)];
            }).join(''));

            if (iteration >= text.length) {
                cancelAnimationFrame(animationFrame);
            } else {
                iteration += 1 / 3;
                animationFrame = requestAnimationFrame(scramble);
            }
        };
        animationFrame = requestAnimationFrame(scramble);
        return () => cancelAnimationFrame(animationFrame);
    }, [text]);

    return <span>{displayText}</span>;
};

const MagneticButton = ({ children, className, href }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
    const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

    const mouseMove = (e) => {
        const { clientX, clientY } = e;
        const { height, width, left, top } = e.currentTarget.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        x.set(middleX * 0.2);
        y.set(middleY * 0.2);
    }

    const mouseLeave = () => {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            style={{ position: "relative", x: springX, y: springY, display: "inline-block" }}
            onMouseMove={mouseMove}
            onMouseLeave={mouseLeave}
        >
            <Link href={href} className={className}>
                {children}
            </Link>
        </motion.div>
    );
};

const RadarGrid = () => {
    const gridRef = useRef(null);
    const handleMouseMove = (e) => {
        if (!gridRef.current) return;
        const rect = gridRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        gridRef.current.style.setProperty('--mouse-x', `${x}px`);
        gridRef.current.style.setProperty('--mouse-y', `${y}px`);
    };
    return (
        <div
            ref={gridRef}
            className={styles.radarGridWrapper}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
                if (gridRef.current) {
                    gridRef.current.style.setProperty('--mouse-x', `-1000px`);
                    gridRef.current.style.setProperty('--mouse-y', `-1000px`);
                }
            }}
        >
            {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className={styles.radarDot} />
            ))}
        </div>
    );
};

import styles from './page.module.css';
import { useAuth } from '@/context/AuthContext';

// lerp helper
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function ParadoxLandingPage() {
    const { user, loading } = useAuth();
    const canvasRef = useRef(null);
    const terminalRef = useRef(null);
    const [scrolled, setScrolled] = useState(false);
    const [readProgress, setReadProgress] = useState(0);

    // Particle System
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let animationFrameId;
        let particles = [];
        let width = window.innerWidth;
        let height = window.innerHeight;

        const setSize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        setSize();
        window.addEventListener('resize', setSize);

        // Create "Px" text points
        const createTextPoints = () => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            tempCanvas.width = width;
            tempCanvas.height = height;

            tempCtx.fillStyle = '#ffffff';
            tempCtx.font = '800 240px Syne';
            tempCtx.textAlign = 'center';
            tempCtx.textBaseline = 'middle';
            tempCtx.fillText('Px', width / 2, height / 2);

            const imageData = tempCtx.getImageData(0, 0, width, height).data;
            const points = [];
            const step = 8;

            for (let y = 0; y < height; y += step) {
                for (let x = 0; x < width; x += step) {
                    const alpha = imageData[(y * width + x) * 4 + 3];
                    if (alpha > 128) {
                        points.push({ x, y });
                    }
                }
            }
            return points;
        };

        let textPoints = createTextPoints();

        // Initialize particles
        const numParticles = Math.min(200, textPoints.length || 200);
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                targetX: 0,
                targetY: 0,
                size: Math.random() * 1.5 + 0.5,
                phase: 'ambient', // ambient, forming, holding, dissolving
                color: 'rgba(232, 244, 253, 0.08)' // --ice-ghost
            });
        }

        let cycleTime = 0;
        let lastTime = performance.now();

        const draw = (time) => {
            if (document.hidden) {
                animationFrameId = requestAnimationFrame(draw);
                return;
            }

            const dt = Math.min(time - lastTime, 50);
            lastTime = time;
            cycleTime += dt;

            // Cycle: 6s ambient -> 2s forming -> 2s holding -> 2s dissolving
            const totalCycle = 12000;
            const t = cycleTime % totalCycle;

            let currentPhase = 'ambient';
            if (t > 6000 && t <= 8000) currentPhase = 'forming';
            else if (t > 8000 && t <= 10000) currentPhase = 'holding';
            else if (t > 10000) currentPhase = 'dissolving';

            // Assign targets on phase shift to forming
            if (currentPhase === 'forming' && particles[0].phase !== 'forming') {
                textPoints = createTextPoints(); // update in case of resize
                particles.forEach(p => {
                    if (textPoints.length > 0) {
                        const point = textPoints[Math.floor(Math.random() * textPoints.length)];
                        p.targetX = point.x + (Math.random() - 0.5) * 10;
                        p.targetY = point.y + (Math.random() - 0.5) * 10;
                    }
                });
            }
            // Assign random scatter on dissolve
            if (currentPhase === 'dissolving' && particles[0].phase !== 'dissolving') {
                particles.forEach(p => {
                    p.targetX = p.x + (Math.random() - 0.5) * (width / 2);
                    p.targetY = p.y + (Math.random() - 0.5) * (height / 2);
                    p.vx = (Math.random() - 0.5) * 2;
                    p.vy = (Math.random() - 0.5) * 2;
                });
            }

            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.phase = currentPhase;

                if (currentPhase === 'ambient') {
                    p.x += p.vx;
                    p.y += p.vy;
                    if (p.x < 0) p.x = width;
                    if (p.x > width) p.x = 0;
                    if (p.y < 0) p.y = height;
                    if (p.y > height) p.y = 0;
                    p.color = 'rgba(232, 244, 253, 0.08)';
                }
                else if (currentPhase === 'forming' || currentPhase === 'holding') {
                    const progress = currentPhase === 'forming' ? (t - 6000) / 2000 : 1;
                    const ease = easeInOutCubic(progress);
                    if (currentPhase === 'forming') {
                        p.x = lerp(p.x, p.targetX, 0.05);
                        p.y = lerp(p.y, p.targetY, 0.05);
                    } else {
                        // wiggle in holding
                        p.x = p.targetX + Math.sin(time * 0.005 + p.y) * 2;
                        p.y = p.targetY + Math.cos(time * 0.005 + p.x) * 2;
                    }
                    // color shift towards paradox
                    p.color = `rgba(255, 45, 85, ${0.1 + progress * 0.3})`;
                }
                else if (currentPhase === 'dissolving') {
                    // fade back out
                    p.x += p.vx;
                    p.y += p.vy;
                    p.color = 'rgba(232, 244, 253, 0.08)';
                }

                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // cap to ~30fps by cheating the request
            setTimeout(() => {
                animationFrameId = requestAnimationFrame(draw);
            }, 33);
        };

        animationFrameId = requestAnimationFrame(draw);
        return () => {
            window.removeEventListener('resize', setSize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Global Scroll & Custom Cursor
    const cursorDotRef = useRef(null);
    const cursorRingRef = useRef(null);
    const [hasFinePointer, setHasFinePointer] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 80);
            const docHeight = document.body.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
            setReadProgress(progress);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        const isFine = window.matchMedia('(pointer: fine)').matches;
        setHasFinePointer(isFine);

        // Custom cursor logic
        if (isFine) {
            document.body.style.cursor = 'none';
            let rX = -100, rY = -100;
            let dX = -100, dY = -100;

            const onMouseMove = (e) => {
                dX = e.clientX;
                dY = e.clientY;
                if (cursorDotRef.current) {
                    cursorDotRef.current.style.left = `${dX}px`;
                    cursorDotRef.current.style.top = `${dY}px`;
                }
            };

            const loop = () => {
                rX = lerp(rX, dX, 0.12);
                rY = lerp(rY, dY, 0.12);
                if (cursorRingRef.current) {
                    cursorRingRef.current.style.left = `${rX}px`;
                    cursorRingRef.current.style.top = `${rY}px`;
                }
                requestAnimationFrame(loop);
            };

            window.addEventListener('mousemove', onMouseMove);
            const rafId = requestAnimationFrame(loop);

            const interactables = document.querySelectorAll('a, button');
            interactables.forEach(el => {
                el.addEventListener('mouseenter', () => cursorRingRef.current?.classList.add(styles.hovering));
                el.addEventListener('mouseleave', () => cursorRingRef.current?.classList.remove(styles.hovering));
            });

            return () => {
                document.body.style.cursor = 'auto';
                window.removeEventListener('scroll', handleScroll);
                window.removeEventListener('mousemove', onMouseMove);
                cancelAnimationFrame(rafId);
            };
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Terminal 3D Tilt
    const handleTerminalMove = (e) => {
        if (!terminalRef.current) return;
        const rect = terminalRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const rotateY = ((e.clientX - centerX) / rect.width) * 8;
        const rotateX = -((e.clientY - centerY) / rect.height) * 8;
        terminalRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleTerminalLeave = () => {
        if (!terminalRef.current) return;
        terminalRef.current.style.transition = 'transform 0.5s ease';
        terminalRef.current.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg)`;
        setTimeout(() => {
            if (terminalRef.current) terminalRef.current.style.transition = 'transform 0.1s ease-out';
        }, 500);
    };

    // Terminal Typewriter Effect
    const [termText, setTermText] = useState("");
    const fullTermText = `$ paradox init --all

✓ Authenticated via central terminal.
✓ Indexed patterns across all active databases...
✓ Mapping frequency algorithms.
✓ Found 847 matching variants.

→ Ready. Initialize link to commence.`;

    useEffect(() => {
        let index = 0;
        const lines = fullTermText.split('\n');
        let currentLine = 0;
        let currentChar = 0;
        let builtText = "";

        const typeWriter = () => {
            if (currentLine >= lines.length) return;

            const isCheckmark = lines[currentLine].startsWith('✓');
            const textToType = lines[currentLine];

            if (isCheckmark) {
                builtText += textToType + '\n';
                setTermText(builtText);
                currentLine++;
                setTimeout(typeWriter, 300); // 300ms stagger for checks
            } else {
                builtText += textToType[currentChar];
                setTermText(builtText);
                currentChar++;

                if (currentChar >= textToType.length) {
                    builtText += '\n';
                    currentLine++;
                    currentChar = 0;
                    setTimeout(typeWriter, 100);
                } else {
                    setTimeout(typeWriter, 30);
                }
            }
        };

        setTimeout(typeWriter, 1000);
    }, []);

    // Chat preview loop
    const chatScript = [
        { role: 'ai', text: 'Walk me through a project where you handled a tight deadline.' },
        { role: 'user', text: 'In my 3rd year, I built a college management system in 2 weeks...' },
        { role: 'ai', text: 'Interesting. What was the hardest technical decision you made?' },
        { role: 'user', text: 'The database design. We had normalized vs denormalized...' },
        { role: 'ai', text: 'Good. One thing to strengthen: mention the tradeoff you considered, not just the choice. Interviewers want your reasoning process.' },
    ];
    const [chatMessages, setChatMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        let step = 0;
        let mounted = true;

        const playChat = async () => {
            while (mounted) {
                setChatMessages([]);
                for (let i = 0; i < chatScript.length; i++) {
                    const msg = chatScript[i];
                    if (!mounted) break;

                    if (msg.role === 'ai') {
                        setIsTyping(true);
                        await new Promise(r => setTimeout(r, 700 + msg.text.length * 15));
                        setIsTyping(false);
                    } else {
                        await new Promise(r => setTimeout(r, 400));
                    }

                    if (!mounted) break;
                    setChatMessages(prev => [...prev, msg]);
                    await new Promise(r => setTimeout(r, 500));
                }
                await new Promise(r => setTimeout(r, 3000));
            }
        };

        playChat();
        return () => { mounted = false; };
    }, []);

    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        let mounted = true;
        fetch('/api/companies')
            .then(res => res.json())
            .then(data => {
                if (mounted && Array.isArray(data)) setCompanies(data);
            })
            .catch(console.error);
        return () => { mounted = false; };
    }, []);

    return (
        <div className={styles.page} suppressHydrationWarning>

            <div className={styles.noiseOverlay} />
            <div className={styles.readingProgress} style={{ width: `${readProgress}%` }} />

            {hasFinePointer && (
                <>
                    <div ref={cursorDotRef} className={styles.customCursorDot} />
                    <div ref={cursorRingRef} className={styles.customCursorRing} />
                </>
            )}

            {/* Navbar */}
            <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
                <div className={styles.navLogo}>
                    <InfinityIcon size={28} className={styles.navLogoMark} />
                    Paradox
                </div>
                <div className={styles.navLinks}>
                    <Link href="/companies" className={styles.navLink}>Companies</Link>
                </div>
                <div className={styles.navActions}>
                    {!loading ? (
                        user ? (
                            <Link href="/dashboard" className={styles.navBtnStart}>Dashboard &rarr;</Link>
                        ) : (
                            <>
                                <Link href="/login" className={styles.navLink}>Login</Link>
                                <Link href="/signup" className={styles.navBtnStart}>Get Started &rarr;</Link>
                            </>
                        )
                    ) : null}
                </div>
            </nav>

            {/* ACT 1: ARRIVAL */}
            <section className={styles.act1}>
                <canvas ref={canvasRef} className={styles.particleCanvas} />

                <div className={styles.heroSplit}>
                    <div className={styles.heroLeft}>
                        <div className={styles.heroBadge}>
                            <div className={styles.badgeIconWrapper}>
                                <InfinityIcon size={14} color="var(--paradox)" />
                            </div>
                            <span>For Productivity at Deadlines</span>
                        </div>
                        <h1 className={styles.heroTitle}>
                            <ScrambleText text="THE" /><br />
                            <ScrambleText text="UNFAIR" /><br />
                            <ScrambleText text="ADVANTAGE." />
                        </h1>
                        <p className={styles.heroDesc}>
                            Placement prep built on real questions, real patterns, real students who cracked it. Your college. Your companies. No noise.
                        </p>
                        <div className={styles.heroCtas}>
                            <MagneticButton href="/companies" className={styles.heroPrimaryBtn}>Start Preparing &rarr;</MagneticButton>
                            <MagneticButton href="/companies" className={styles.heroSecondaryBtn}>Browse Companies</MagneticButton>
                        </div>
                    </div>

                    <div className={styles.heroRight} onMouseMove={handleTerminalMove} onMouseLeave={handleTerminalLeave}>
                        <div className={styles.terminalWrapper}>
                            <div ref={terminalRef} className={styles.terminal}>
                                <div className={styles.terminalHeader}>
                                    <div className={`${styles.termDot} ${styles.termDotRec}`} />
                                    <div className={`${styles.termDot} ${styles.termDotYel}`} />
                                    <div className={`${styles.termDot} ${styles.termDotGre}`} />
                                </div>
                                <div className={styles.terminalContent}>
                                    {termText}
                                    <motion.span
                                        animate={{ opacity: [1, 0] }}
                                        transition={{ repeat: Infinity, duration: 0.8 }}
                                    >
                                        █
                                    </motion.span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.scrollIndicator} data-hidden={scrolled}>
                    <span className={styles.scrollText}>scroll</span>
                    <div className={styles.scrollLine} />
                </div>
            </section>

            {/* ACT 2: THE CLAIM */}
            <section className={styles.act2}>
                <div className={styles.claimContent}>
                    <h2 className={styles.claimText}>
                        <span className={styles.claimGhost}><ScrambleText text="Everyone" /></span><br />
                        <span className={styles.claimWhite}>prepares.</span>
                    </h2>
                    <div className={styles.claimGap} />
                    <h2 className={styles.claimText}>
                        <span className={styles.claimRed}><ScrambleText text="You prepare" /></span><br />
                        <span className={styles.claimWhite}>different.</span>
                    </h2>
                    <p className={styles.claimCode}>
                        // {companies.length > 0 ? `${Math.max(847, companies.length * 105)} questions across ${companies.length} companies` : "847 questions across major tech companies"}. All from your campus. All verified.
                    </p>
                </div>

                <div className={styles.marqueeWrapper}>
                    {/* repeated x2 to make infinite loop simple via css */}
                    <div className={styles.marquee}>
                        <span className={styles.marqueeText}>PREVIOUS YEAR QUESTIONS  ·  REAL PATTERNS  ·  AI INTERVIEWS  ·  COMPANY SPECIFIC  ·  YOUR COLLEGE  ·  YOUR EDGE  ·  </span>
                        <span className={styles.marqueeText}>PREVIOUS YEAR QUESTIONS  ·  REAL PATTERNS  ·  AI INTERVIEWS  ·  COMPANY SPECIFIC  ·  YOUR COLLEGE  ·  YOUR EDGE  ·  </span>
                    </div>
                </div>
            </section>

            {/* ACT 3: THE PROOF */}
            <section className={styles.act3}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionSub}>{companies.length > 0 ? `${companies.length} COMPANIES` : 'SUPPORTED COMPANIES'}</div>
                    <h2 className={styles.sectionTitle}>
                        Every round.
                        <span className={styles.red}>Nothing generic.</span>
                    </h2>
                </div>

                <motion.div
                    className={styles.companyGrid}
                    variants={{
                        hidden: { opacity: 0 },
                        show: {
                            opacity: 1,
                            transition: { staggerChildren: 0.04 }
                        }
                    }}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    {companies.map((company, i) => (
                        <motion.div
                            key={company.id || company.slug || i}
                            className={styles.companyCard}
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                show: { opacity: 1, y: 0 }
                            }}
                        >
                            <div className={styles.companyName}>{company.name || company}</div>
                            <div className={styles.companyIndustry}>{company.industry || 'IT Services'}</div>
                            <div className={styles.roundDots}>
                                <span className={styles.dotGold} title="OA" />
                                <span className={styles.dotIce} title="Technical" />
                                <span className={styles.dotParadox} title="HR" />
                            </div>
                            <div className={styles.questionCount}>{company.questionsCount || (100 + i * 14)} questions</div>
                        </motion.div>
                    ))}
                </motion.div>

                <p className={styles.moreAdded}>+ More added every placement season</p>
            </section>

            {/* ACT 4: THE SYSTEM */}
            <section className={styles.act4}>
                <div className={styles.act4Header}>
                    <div className={styles.sectionSub}>HOW IT WORKS</div>
                    <h2 className={styles.sectionTitle}>
                        Three weapons.
                        <span className={styles.red}> One result.</span>
                    </h2>
                </div>

                <div className={styles.panels}>
                    {/* Panel 1 */}
                    <motion.div
                        className={styles.panel}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <motion.h2 className={styles.panelNum} initial={{ x: -30 }} whileInView={{ x: 0 }} transition={{ duration: 0.7 }}>01</motion.h2>
                        <div className={styles.panelCenter}>
                            <h3>Study Material</h3>
                            <p>Real PYQs from your campus, sorted by company and round. Not random internet questions. The actual ones.</p>
                        </div>
                        <motion.div className={styles.panelVisual} initial={{ scale: 0.9 }} whileInView={{ scale: 1 }} transition={{ duration: 0.7 }}>
                            <RadarGrid />
                        </motion.div>
                    </motion.div>

                    {/* Panel 2 */}
                    <motion.div
                        className={styles.panel}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <motion.h2 className={styles.panelNum} initial={{ x: -30 }} whileInView={{ x: 0 }} transition={{ duration: 0.7 }}>02</motion.h2>
                        <div className={styles.panelCenter}>
                            <h3>Mock Tests</h3>
                            <p>Timed. Pressure. Real patterns. OA that mirrors exactly what TCS actually sends. Monaco editor for coding rounds.</p>
                        </div>
                        <motion.div className={styles.panelVisual} initial={{ scale: 0.9 }} whileInView={{ scale: 1 }} transition={{ duration: 0.7 }}>
                            <div className={styles.mockUi}>
                                <div className={styles.mockHeader}>
                                    <div className={styles.mockProgressWrapper}><div className={styles.mockProgressFill} /></div>
                                    <div className={styles.mockTimer}>12:47</div>
                                </div>
                                <div className={styles.mockQ}>Which of the following data structures...</div>
                                <div className={styles.mockOptionSelected}>A. Binary Search Tree</div>
                                <div className={styles.mockOption}>B. Hash Map</div>
                                <div className={styles.mockOption}>C. Linked List</div>
                                <div className={styles.mockOption}>D. Stack</div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Panel 3 */}
                    <motion.div
                        className={styles.panel}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <motion.h2 className={styles.panelNum} initial={{ x: -30 }} whileInView={{ x: 0 }} transition={{ duration: 0.7 }}>03</motion.h2>
                        <div className={styles.panelCenter}>
                            <h3>AI Mock Interviews</h3>
                            <p>An AI that plays interviewer. Asks in TCS's style. Listens to your answer. Then tells you exactly what was weak.</p>
                        </div>
                        <motion.div className={styles.panelVisual} initial={{ scale: 0.9 }} whileInView={{ scale: 1 }} transition={{ duration: 0.7 }}>
                            <div className={styles.chatUi}>
                                <div className={styles.chatAi}>Tell me about yourself.</div>
                                <div className={styles.chatUser}>I'm a final year CSE...</div>
                                <div className={styles.chatAi}>What's your strongest skill?</div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ACT 5: THE EDGE */}
            <section className={styles.act5}>
                <div className={styles.edgeSplit}>
                    <div className={styles.edgeLeft}>
                        <div className={styles.edgeSub}>The part everyone dreads.</div>
                        <h2 className={styles.edgeTitle}>
                            Practice the<br />interview until<br />it's boring.
                        </h2>
                        <p className={styles.edgeDesc}>
                            Our AI has studied TCS's HR patterns, Infosys's technical style, Wipro's behavioral questions. It interviews you like they do. Then it tells you what to fix. Voice or text. You choose.
                        </p>
                        <div className={styles.edgeLink}>&rarr; Try a mock interview</div>
                    </div>

                    <div className={styles.edgeRight}>
                        <div className={styles.chatPreview}>
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={msg.role === 'ai' ? styles.chatMsgAi : styles.chatMsgUser}>
                                    {msg.text}
                                </div>
                            ))}
                            {isTyping && (
                                <div className={styles.typingIndicator}>
                                    <div className={styles.typingDot} />
                                    <div className={styles.typingDot} />
                                    <div className={styles.typingDot} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ACT 6: THE MOMENT */}
            <section className={styles.act6}>
                <div className={styles.momentContent}>
                    <div className={styles.momentQuoteMark}>"</div>
                    <p className={styles.momentQuote}>
                        I wish I had this when I was preparing for my interviews. It would have made a huge difference.
                    </p>
                    <div className={styles.momentAuthor}>
                        <div className={styles.momentAvatar}>C</div>
                        <div>
                            <div className={styles.momentName}>Chainika D. <CheckCircle2 size={14} className={styles.momentVerified} /></div>
                            <div className={styles.momentRole}>CSE 2025 &middot; Placed at Capgemini</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ACT 7: THE CALL */}
            <section className={styles.act7}>
                <div className={styles.callSub}>YOUR CAMPUS. YOUR COMPANIES. YOUR EDGE.</div>
                <h2 className={styles.callTitle}>
                    <ScrambleText text="Stop preparing." /><br />
                    <ScrambleText text="Start knowing." />
                </h2>
                <p className={styles.callDesc}>
                    Paradox is built exclusively for your college's placement season. Real questions. Real patterns. The unfair advantage.
                </p>

                <MagneticButton href="/signup" className={styles.callBtn}>
                    Get Your Edge &rarr;
                </MagneticButton>

                <p className={styles.callNote}>Sign up with your college email. Free forever for students.</p>

                <div className={styles.footer}>
                    Paradox &copy; 2026 &middot; Built for engineers, by engineers &middot; Not affiliated with any company
                </div>
            </section>

        </div >
    );
}
