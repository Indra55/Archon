import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Lightbulb, ExternalLink, CheckCheck } from 'lucide-react';
import { OnboardingTask, QUIZ_QUESTIONS, QuizQuestion } from '@/data/onboardingMockData';

interface TaskDetailModalProps {
    task: OnboardingTask;
    onClose: () => void;
    onComplete: (taskId: string) => void;
    onNavigate: (path: string) => void;
}

export function TaskDetailModal({ task, onClose, onComplete, onNavigate }: TaskDetailModalProps) {
    const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
    const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
    const [showExplanation, setShowExplanation] = useState(false);

    const isQuiz = task.type === 'quiz';
    const quizQuestionsForTask = QUIZ_QUESTIONS.filter(q => task.id.includes('sys') ? ['q1', 'q2', 'q3'].includes(q.id) : false);
    const questions = isQuiz ? QUIZ_QUESTIONS : [];
    const currentQ = questions[currentQuizQuestion];

    const handleQuizAnswer = (index: number) => {
        if (showExplanation) return;
        setQuizAnswers(prev => ({ ...prev, [currentQ.id]: index }));
        setShowExplanation(true);
    };

    const nextQuestion = () => {
        if (currentQuizQuestion < questions.length - 1) {
            setCurrentQuizQuestion(prev => prev + 1);
            setShowExplanation(false);
        } else {
            const correctCount = questions.filter(q => quizAnswers[q.id] === q.correctIndex).length;
            if (correctCount === questions.length) {
                onComplete(task.id);
            }
        }
    };

    const correctCount = Object.keys(quizAnswers).length === questions.length ? questions.filter(q => quizAnswers[q.id] === q.correctIndex).length : -1;

    const badgeProps = {
        read: { bg: 'bg-[#6366F1]/10', text: 'text-[#6366F1]', border: 'border-[#6366F1]/20' },
        explore: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
        task: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
        quiz: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
    }[task.type] || { bg: 'bg-[#1A1A1A]', text: 'text-[#888]', border: 'border-[#2A2A2A]' };

    const handleDeepLink = () => {
        if (!task.deepLink) return;
        const url = task.deepLink.route + '?' + new URLSearchParams(task.deepLink.params).toString();
        if (task.deepLink.openInNewTab) {
            window.open(url, '_blank');
        } else {
            onNavigate(url);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-base/80 backdrop-blur-md z-50 flex items-start justify-center overflow-y-auto pt-[10vh] pb-[10vh]">
            <div className="absolute inset-0" onClick={onClose} />
            <motion.div
                className="bg-surface border border-dim rounded-3xl max-w-2xl w-full relative mb-[5vh] flex flex-col shadow-2xl overflow-hidden"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            >
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />

                <button onClick={onClose} className="absolute top-6 right-6 text-muted hover:text-primary bg-elevated hover:bg-surface border border-dim rounded-full p-2 outline-none z-10 transition-colors shadow-sm">
                    <X size={20} />
                </button>

                <div className="px-10 py-8 border-b border-dim relative z-10 bg-surface/50">
                    <div className="flex items-center gap-3 mb-3">
                        <span className={`font-mono text-[11px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1 ${badgeProps.bg} ${badgeProps.text} border ${badgeProps.border} shadow-sm`}>
                            {task.type}
                        </span>
                        <div className="font-mono text-sm text-secondary bg-elevated border border-dim rounded-lg px-2 py-0.5">{task.moduleId} module</div>
                    </div>
                    <h2 className="font-['Syne'] text-3xl font-bold text-primary tracking-tight">{task.title}</h2>
                </div>

                <div className="px-10 py-8 flex flex-col gap-8 relative z-10 bg-base/50">
                    <div>
                        <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted mb-3">Task Overview</div>
                        <p className="font-mono text-base text-secondary leading-loose">
                            {task.description}
                        </p>
                    </div>

                    <div className="bg-green-500/5 border border-green-500/20 rounded-2xl px-6 py-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={18} className="text-green-500" />
                            <span className="font-['Syne'] text-sm font-bold text-green-500 tracking-wide uppercase">Completion Criteria</span>
                        </div>
                        <p className="font-mono text-sm text-primary leading-relaxed">
                            {task.completionCriteria}
                        </p>
                    </div>

                    {task.hint && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl px-6 py-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Lightbulb size={18} className="text-amber-500" />
                                <span className="font-['Syne'] text-sm font-bold text-amber-500 tracking-wide uppercase">Pro Tip</span>
                            </div>
                            <p className="font-mono text-sm text-primary leading-relaxed">
                                {task.hint}
                            </p>
                        </div>
                    )}

                    {isQuiz && questions.length > 0 && correctCount === -1 && (
                        <div className="mt-4 border-t border-dim pt-8">
                            <h3 className="font-['Inter'] text-xl text-primary font-semibold mb-6">{currentQ.question}</h3>
                            <div className="flex flex-col gap-3">
                                {currentQ.options.map((opt, idx) => {
                                    const isSelected = quizAnswers[currentQ.id] === idx;
                                    let bgObj = 'bg-surface border border-dim text-secondary hover:bg-elevated hover:border-muted';
                                    let icon = null;

                                    if (showExplanation) {
                                        if (idx === currentQ.correctIndex) {
                                            bgObj = 'bg-green-500/10 border-green-500/40 text-green-500';
                                            if (isSelected) icon = <span className="ml-3 font-mono text-sm font-medium">✓ Correct</span>;
                                        } else if (isSelected) {
                                            bgObj = 'bg-red-500/10 border-red-500/40 text-red-500';
                                            icon = <span className="ml-3 font-mono text-sm font-medium">✗ Incorrect</span>;
                                        } else {
                                            bgObj = 'bg-base border-dim text-muted';
                                        }
                                    } else if (isSelected) {
                                        bgObj = 'bg-accent/10 border-accent/40 text-accent';
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleQuizAnswer(idx)}
                                            disabled={showExplanation}
                                            className={`rounded-xl px-5 py-4 w-full font-mono text-sm text-left transition-all duration-300 flex items-center justify-between outline-none ${bgObj}`}
                                        >
                                            <span className="leading-relaxed">{opt}</span>
                                            {icon}
                                        </button>
                                    );
                                })}
                            </div>

                            <AnimatePresence>
                                {showExplanation && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-6 flex flex-col gap-4 overflow-hidden"
                                    >
                                        <div className="font-mono text-sm text-primary bg-elevated p-5 rounded-xl border border-dim leading-relaxed relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-l-xl" />
                                            {currentQ.explanation}
                                        </div>
                                        <button
                                            onClick={nextQuestion}
                                            className="self-end bg-accent hover:opacity-90 text-white rounded-xl px-6 py-3 font-mono text-sm font-medium transition-colors outline-none cursor-pointer flex items-center gap-2 shadow-sm"
                                        >
                                            {currentQuizQuestion < questions.length - 1 ? 'Next Question →' : 'Complete Quiz →'}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {isQuiz && correctCount !== -1 && (
                        <div className="mt-4 border-t border-dim pt-10 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-elevated rounded-full flex items-center justify-center border-4 border-dim mb-6">
                                <span className="font-['Syne'] text-2xl font-bold text-primary">{correctCount}/{questions.length}</span>
                            </div>

                            <h3 className="font-['Syne'] text-2xl font-bold text-primary mb-2">Quiz Completed</h3>

                            {correctCount === questions.length ? (
                                <div className="font-mono text-base text-green-500 flex items-center justify-center gap-2 bg-green-500/10 px-5 py-3 rounded-xl border border-green-500/20 w-fit mt-4 font-medium">
                                    <CheckCheck size={20} /> Perfect Score! Task marked as completed.
                                </div>
                            ) : (
                                <div className="font-mono text-base text-amber-500 bg-amber-500/10 px-5 py-3 rounded-xl border border-amber-500/20 w-fit mt-4 font-medium">
                                    You need to get all questions right to complete this task.
                                </div>
                            )}
                            {correctCount < questions.length && (
                                <button
                                    onClick={() => {
                                        setCurrentQuizQuestion(0);
                                        setQuizAnswers({});
                                        setShowExplanation(false);
                                    }}
                                    className="bg-elevated border border-dim text-primary hover:bg-surface hover:border-muted rounded-xl px-6 py-3 mt-8 font-mono text-sm font-medium transition-all cursor-pointer outline-none shadow-sm"
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {!isQuiz && (
                    <div className="px-10 py-6 flex items-center gap-4 border-t border-dim bg-surface">
                        {task.deepLink && (
                            <button
                                onClick={handleDeepLink}
                                className="bg-accent hover:opacity-90 text-white rounded-xl px-6 py-4 font-mono text-sm font-semibold flex items-center justify-center gap-2 flex-1 transition-all outline-none shadow-sm"
                            >
                                {task.deepLink.label}
                                <ExternalLink size={16} />
                            </button>
                        )}
                        <button
                            onClick={() => { onComplete(task.id); onClose(); }}
                            className="bg-elevated hover:bg-surface border border-dim rounded-xl px-6 py-4 font-mono text-sm font-medium text-muted hover:text-primary flex items-center gap-2 transition-all outline-none cursor-pointer flex-1 justify-center"
                        >
                            <CheckCheck size={16} />
                            Mark as Complete
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
