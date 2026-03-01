'use client';
import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import styles from './AntigravityCard.module.css';

export default function AntigravityCard({ children, className }) {
    const ref = useRef(null);

    // Mouse position
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth springs for tilt
    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

    // Map mouse position to rotation (-10deg to 10deg)
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

    // Dynamic glow effect based on mouse hover
    const [hovered, setHovered] = useState(false);

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Mouse position relative to center of element (-0.5 to 0.5)
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = (mouseX / width) - 0.5;
        const yPct = (mouseY / height) - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        setHovered(false);
        x.set(0);
        y.set(0);
    };

    const handleMouseEnter = () => {
        setHovered(true);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
            }}
            className={`${styles.antigravityWrapper} ${className || ''}`}
            whileHover={{ scale: 1.02, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            <div className={`${styles.cardContent} ${hovered ? styles.hovered : ''}`}>
                {children}
            </div>

            {/* Floating Shadow that expands underneath when hovered */}
            <motion.div
                className={styles.floatingShadow}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.8 }}
                transition={{ duration: 0.3 }}
            />
        </motion.div>
    );
}
