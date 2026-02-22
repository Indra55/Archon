import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface CompletionCelebrationProps {
    onDismiss: () => void;
}

export function CompletionCelebration({ onDismiss }: CompletionCelebrationProps) {
    const pieces = useMemo(() => {
        const colors = ['#6366F1', '#10B981', '#F59E0B', '#06B6D4']; // accent, green, amber, cyan
        const arr = [];
        for (let i = 0; i < 60; i++) {
            const isSquare = Math.random() > 0.5;
            arr.push({
                id: i,
                x: Math.random() * 100, // vw
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                duration: 1.5 + Math.random(),
                delay: Math.random() * 0.8,
                width: isSquare ? 8 : 10,
                height: isSquare ? 8 : 4,
            });
        }
        return arr;
    }, []);

    const confettiVariants = {
        initial: (custom: any) => ({
            y: -20,
            x: `${custom.x}vw`,
            rotate: custom.rotation,
            opacity: 1
        }),
        animate: (custom: any) => ({
            y: '110vh',
            x: [
                `${custom.x}vw`,
                `${custom.x - 2}vw`,
                `${custom.x + 2}vw`,
                `${custom.x - 1}vw`,
            ],
            rotate: custom.rotation + 360,
            opacity: [1, 1, 0],
            transition: {
                duration: custom.duration,
                ease: 'linear' as const,
                delay: custom.delay,
                x: {
                    duration: custom.duration,
                    repeat: Infinity,
                    repeatType: 'mirror' as const,
                    ease: 'easeInOut' as const
                }
            }
        })
    };

    return (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
            {pieces.map(piece => (
                <motion.div
                    key={piece.id}
                    custom={piece}
                    variants={confettiVariants}
                    initial="initial"
                    animate="animate"
                    className="absolute top-0 rounded-sm"
                    style={{
                        backgroundColor: piece.color,
                        width: piece.width,
                        height: piece.height,
                    }}
                />
            ))}

            <div className="fixed top-[30%] left-1/2 -translate-x-1/2 pointer-events-auto">
                <motion.div
                    className="bg-[#111] border border-[#2A2A2A] rounded-2xl p-8 max-w-xs text-center shadow-2xl"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                    <div className="text-5xl mb-3">🎉</div>
                    <h2 className="font-['Syne'] text-xl font-bold text-[#E5E5E5]">Module complete!</h2>
                    <p className="font-mono text-sm text-[#A1A1A1] mt-1">
                        Keep the momentum going.
                    </p>
                    <button
                        onClick={onDismiss}
                        className="mt-6 bg-[#6366F1] hover:bg-[#5558E6] text-white rounded-lg px-6 py-2.5 font-mono text-sm transition-colors outline-none cursor-pointer w-full"
                    >
                        Continue
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
