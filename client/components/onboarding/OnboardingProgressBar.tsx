import React from 'react';
import { motion } from 'framer-motion';

interface OnboardingProgressBarProps {
    value: number;
    height?: number;
    variant?: 'default' | 'thin';
}

export function OnboardingProgressBar({ value, height = 6, variant = 'default' }: OnboardingProgressBarProps) {
    const finalHeight = variant === 'thin' ? 3 : height;

    return (
        <div className="w-full bg-[#1A1A1A] rounded-full overflow-hidden" style={{ height: finalHeight }}>
            <motion.div
                className="h-full bg-[#6366F1] rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_ease_infinite]" />
            </motion.div>
        </div>
    );
}
