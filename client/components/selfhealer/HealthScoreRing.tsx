import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HealthScoreRingProps {
    score: number;
    previousScore: number;
    isAnimating: boolean;
    size?: number;
}

export function HealthScoreRing({ score, previousScore, isAnimating, size = 96 }: HealthScoreRingProps) {
    const [displayScore, setDisplayScore] = useState(isAnimating ? previousScore : score);

    useEffect(() => {
        if (!isAnimating) {
            setDisplayScore(score);
            return;
        }

        let startTime: number;
        let animationFrame: number;
        const duration = 1200;

        const animate = (time: number) => {
            if (!startTime) startTime = time;
            const progress = Math.min((time - startTime) / duration, 1);

            setDisplayScore(Math.floor(previousScore + (score - previousScore) * progress));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setDisplayScore(score);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [score, previousScore, isAnimating]);

    const getColor = (val: number) => {
        if (val < 50) return '#EF4444'; // red-500
        if (val < 75) return '#F59E0B'; // amber-500
        return '#22C55E'; // green-500
    };

    const currentColor = getColor(displayScore);
    const targetColor = getColor(score);

    const circumference = 2 * Math.PI * 38;
    const currentOffset = circumference * (1 - score / 100);
    const previousOffset = circumference * (1 - previousScore / 100);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox="0 0 96 96" className="absolute inset-0">
                <circle
                    cx="48" cy="48" r="38"
                    fill="none" stroke="var(--color-border, #333)" strokeWidth="6"
                />

                <AnimatePresence>
                    {isAnimating && score > previousScore && (
                        <motion.circle
                            cx="48" cy="48" r="38"
                            fill="none" strokeWidth="14"
                            stroke={targetColor}
                            initial={{ opacity: 0, scale: 1 }}
                            animate={{ opacity: [0, 0.4, 0], scale: [1, 1.08, 1] }}
                            transition={{ duration: 0.8 }}
                            style={{ transformOrigin: 'center' }}
                        />
                    )}
                </AnimatePresence>

                <motion.circle
                    cx="48" cy="48" r="38"
                    fill="none" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={isAnimating ? currentOffset : (circumference * (1 - score / 100))}
                    stroke={isAnimating ? targetColor : currentColor}
                    transform="rotate(-90 48 48)"
                    initial={isAnimating ? { strokeDashoffset: previousOffset, stroke: getColor(previousScore) } : false}
                    animate={isAnimating ? { strokeDashoffset: currentOffset, stroke: targetColor } : false}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />

                <text
                    x="48" y="44"
                    textAnchor="middle" dominantBaseline="middle"
                    className="font-['Syne'] text-2xl font-bold fill-[var(--color-primary,#E5E5E5)]"
                >
                    {displayScore}
                </text>

                <text
                    x="48" y="58"
                    textAnchor="middle" dominantBaseline="middle"
                    className="font-mono text-[9px] fill-[var(--color-muted,#737373)]"
                >
                    /100
                </text>
            </svg>
        </div>
    );
}
