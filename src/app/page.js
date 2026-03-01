'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, Brain, FileText, MessageSquare, Sparkles, Users, BookOpen, Trophy, ChevronRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import AntigravityCard from '@/components/AntigravityCard';
import styles from './page.module.css';

function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= end) {
            setCount(end);
            clearInterval(timer);
          } else {
            setCount(Math.floor(start));
          }
        }, 16);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const features = [
  { icon: <Sparkles size={28} />, title: 'AI-Powered Prep', desc: 'Auto-generated quizzes and interview questions using advanced AI.' },
  { icon: <Building2 size={28} />, title: 'Company Intelligence', desc: 'Deep insights into 500+ companies with employee testimonials.' },
  { icon: <Brain size={28} />, title: 'Practice Quizzes', desc: 'Aptitude, reasoning, verbal, and coding challenges.' },
  { icon: <MessageSquare size={28} />, title: 'Interview Bank', desc: 'Company-specific interview questions with detailed answers.' },
];

const categories = [
  { name: 'Aptitude', icon: '🧮', color: '#10b981' },
  { name: 'Logical Reasoning', icon: '🧩', color: '#14b8a6' },
  { name: 'Verbal Ability', icon: '📝', color: '#06b6d4' },
  { name: 'Coding & DSA', icon: '💻', color: '#8b5cf6' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'SDE at Google', text: 'FirstJobs helped me crack my dream placement. The AI-generated questions were spot on!', rating: 5 },
  { name: 'Rahul Kumar', role: 'Analyst at Deloitte', text: 'The company-specific prep materials gave me a huge edge in my interviews.', rating: 5 },
  { name: 'Ananya Gupta', role: 'Developer at TCS', text: 'Previous year papers and mock tests helped me prepare systematically.', rating: 4 },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroGlow1} />
          <div className={styles.heroGlow2} />
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Sparkles size={14} />
            AI-Powered Placement Preparation
          </div>
          <h1 className={styles.heroTitle}>
            Land Your <span className={styles.gradientText}>Dream Job</span> with Smart Preparation
          </h1>
          <p className={styles.heroSubtitle}>
            Prepare for campus placements with AI-generated quizzes, company-specific interview prep, previous year papers, and real employee testimonials.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/companies" className={styles.btnPrimary}>
              Explore Companies <ArrowRight size={18} />
            </Link>
            <Link href="/quizzes" className={styles.btnSecondary}>
              Start Practicing <ChevronRight size={18} />
            </Link>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}><AnimatedCounter end={500} suffix="+" /></span>
              <span className={styles.statLabel}>Companies</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNumber}><AnimatedCounter end={10} suffix="K+" /></span>
              <span className={styles.statLabel}>Questions</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNumber}><AnimatedCounter end={1} suffix="K+" /></span>
              <span className={styles.statLabel}>Papers</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNumber}><AnimatedCounter end={50} suffix="K+" /></span>
              <span className={styles.statLabel}>Students</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <h2 className="section-title">Why Choose FirstJobs?</h2>
          <p className="section-subtitle">Everything you need to ace your campus placement, powered by AI.</p>
          <motion.div
            className={styles.featuresGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                }}
              >
                <AntigravityCard className={styles.featureCard}>
                  <div className={styles.featureIcon}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </AntigravityCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Quiz Categories */}
      <section className={styles.quizSection}>
        <div className="container">
          <h2 className="section-title">Practice by Category</h2>
          <p className="section-subtitle">Choose your area and start solving questions.</p>
          <div className={styles.categoryGrid}>
            {categories.map((c, i) => (
              <Link href="/quizzes" key={i} className={styles.categoryCard}>
                <span className={styles.categoryIcon}>{c.icon}</span>
                <h3>{c.name}</h3>
                <span className={styles.categoryArrow}><ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonials}>
        <div className="container">
          <h2 className="section-title">Student Success Stories</h2>
          <p className="section-subtitle">Hear from students who landed their dream placements.</p>
          <motion.div
            className={styles.testimonialGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.15 }
              }
            }}
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                }}
                style={{ height: '100%' }}
              >
                <AntigravityCard className={styles.testimonialCard}>
                  <div className={styles.testimonialStars}>
                    {[...Array(t.rating)].map((_, j) => <Star key={j} size={16} fill="#f59e0b" color="#f59e0b" />)}
                  </div>
                  <p className={styles.testimonialText}>"{t.text}"</p>
                  <div className={styles.testimonialAuthor}>
                    <div className={styles.testimonialAvatar}>{t.name[0]}</div>
                    <div>
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                    </div>
                  </div>
                </AntigravityCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaInner}>
            <Trophy size={48} className={styles.ctaIcon} />
            <h2>Ready to Start Your Placement Journey?</h2>
            <p>Join thousands of students who are preparing smarter with AI. </p>
            <Link href="/companies" className={styles.btnCta}>
              Get Started Now <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
