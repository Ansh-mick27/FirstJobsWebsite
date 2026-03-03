'use client';

import Link from 'next/link';
import { ArrowRight, Terminal, BookOpen, BrainCircuit, Target, Code2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './page.module.css';

const features = [
  { icon: <BookOpen size={24} />, title: 'Study Material', desc: 'Curated previous year questions and concepts organized by company and round.' },
  { icon: <Terminal size={24} />, title: 'Mock Tests', desc: 'Simulated assessments covering OA, technical, and reasoning sections.' },
  { icon: <BrainCircuit size={24} />, title: 'AI Interview', desc: 'Live voice interviews with an AI agent tailored to the target company.' },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />

        <div className={styles.heroContent}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.heroBadge}>
              <Target size={14} className={styles.accentIcon} />
              <span>Level up your career</span>
            </div>

            <h1 className={styles.heroTitle}>
              CRACK YOUR <br /> PLACEMENT
            </h1>

            <p className={styles.heroSubtitle}>
              Company-specific prep. Real PYQs. AI mock interviews.
            </p>

            <div className={styles.heroCtas}>
              <Link href="/companies" className={styles.btnPrimary}>
                Start Preparing <ArrowRight size={18} />
              </Link>
              <Link href="/companies" className={styles.btnSecondary}>
                Browse Companies
              </Link>
            </div>
          </motion.div>

          <motion.div
            className={styles.heroStats}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {[
              { label: 'Companies', val: '47' },
              { label: 'Questions', val: '2,400' },
              { label: 'AI Interviews', val: 'Active' }
            ].map((stat, i) => (
              <div key={i} className={styles.statCard}>
                <span className={styles.statNumber}>{stat.val}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.howItWorks}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>The Playbook</h2>
            <p className={styles.sectionSubtitle}>Three steps to landing the offer.</p>
          </div>

          <div className={styles.stepsGrid}>
            {[
              { num: '01', title: 'Browse Targets', text: 'Select the companies visiting your campus or that you want to apply to off-campus.' },
              { num: '02', title: 'Practice Rounds', text: 'Solve real previous year questions tailored to their specific hiring patterns.' },
              { num: '03', title: 'Mock Interview', text: 'Face our AI recruiter to perfect your communication and technical delivery.' }
            ].map((step, i) => (
              <motion.div
                key={i}
                className={styles.stepCard}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className={styles.stepNum}>{step.num}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.featuresGrid}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                className={styles.featureCard}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className={styles.featureIconBox}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className={styles.cardGlow} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.cta}>
        <div className="container">
          <motion.div
            className={styles.ctaInner}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2>Ready to play?</h2>
            <p>Select your target company and start leveling up your skills.</p>
            <Link href="/companies" className={styles.btnCta}>
              Select Target <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
