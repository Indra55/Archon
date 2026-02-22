import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, AlertCircle, X } from 'lucide-react';
import { Toast } from '@/hooks/useSelfHealer';

export function ToastNotification({ toast, onDismiss }: { toast: Toast, onDismiss: () => void }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const Icon = () => {
        switch (toast.type) {
            case 'success': return <CheckCircle size={18} className="text-green-500" />;
            case 'info': return <Info size={18} className="text-accent" />;
            case 'error': return <AlertCircle size={18} className="text-red-500" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 pointer-events-auto bg-elevated border border-dim rounded-2xl px-5 py-3.5 flex flex-row items-center gap-4 min-w-[320px] max-w-[480px] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
            <Icon />

            <div className="flex-1 flex flex-col justify-center min-w-0">
                <p className="font-mono text-sm text-primary leading-tight truncate">{toast.message}</p>
                {toast.action && (
                    <button
                        onClick={() => { toast.action!.onClick(); onDismiss(); }}
                        className="font-mono text-xs text-accent hover:text-accent/80 transition-colors text-left flex self-start outline-none cursor-pointer mt-0.5 whitespace-nowrap"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>

            <button onClick={onDismiss} className="text-muted hover:text-primary transition-colors outline-none cursor-pointer flex-shrink-0">
                <X size={14} />
            </button>
        </motion.div>
    );
}
