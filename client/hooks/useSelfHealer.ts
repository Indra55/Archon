import { useState, useMemo } from 'react';
import {
    SuggestionItem, SuggestionCategory, SuggestionStatus,
    SUGGESTIONS, SCAN_DISCOVERY
} from '@/data/selfHealerMockData';

export type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'deferred';

export interface Toast {
    id: string;
    type: 'success' | 'info' | 'error';
    message: string;
    action?: { label: string; onClick: () => void };
}

export interface SelfHealerHook {
    suggestions: SuggestionItem[];
    filteredSuggestions: SuggestionItem[];
    expandedSuggestionId: string | null;
    setExpandedSuggestionId: (id: string | null) => void;
    drawerSuggestionId: string | null;
    openDrawer: (id: string) => void;
    closeDrawer: () => void;
    approveSuggestion: (id: string) => void;
    rejectSuggestion: (id: string) => void;
    deferSuggestion: (id: string) => void;
    undoLastAction: () => void;
    canUndo: boolean;
    filterStatus: FilterStatus;
    setFilterStatus: (s: FilterStatus) => void;
    filterService: string;
    setFilterService: (s: string) => void;
    filterCategory: SuggestionCategory | 'all';
    setFilterCategory: (c: SuggestionCategory | 'all') => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    sortKey: 'severity' | 'service' | 'category' | 'date';
    setSortKey: (k: 'severity' | 'service' | 'category' | 'date') => void;
    healthScore: number;
    previousHealthScore: number;
    isScoreAnimating: boolean;
    isScanning: boolean;
    triggerScan: () => void;
    scanProgress: number;
    activeToast: Toast | null;
    dismissToast: () => void;
    stats: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        deferred: number;
        estimatedHoursAutoSaved: number;
    };
}

export function useSelfHealer(): SelfHealerHook {
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>(SUGGESTIONS);

    const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null);
    const [drawerSuggestionId, setDrawerSuggestionId] = useState<string | null>(null);

    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [filterService, setFilterService] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<SuggestionCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortKey, setSortKey] = useState<'severity' | 'service' | 'category' | 'date'>('severity');

    const [healthScore, setHealthScore] = useState<number>(74);
    const [previousHealthScore, setPreviousHealthScore] = useState<number>(74);
    const [isScoreAnimating, setIsScoreAnimating] = useState<boolean>(false);

    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [scanProgress, setScanProgress] = useState<number>(0);

    const [activeToast, setActiveToast] = useState<Toast | null>(null);

    const [lastAction, setLastAction] = useState<{
        suggestionId: string;
        previousStatus: SuggestionStatus;
        scoreBeforeAction: number;
    } | null>(null);

    const showToast = (toast: Omit<Toast, 'id'>) => {
        setActiveToast({ ...toast, id: Math.random().toString(36).substring(7) });
    };

    const dismissToast = () => setActiveToast(null);

    const updateSuggestionStatus = (id: string, newStatus: SuggestionStatus) => {
        const idx = suggestions.findIndex(s => s.id === id);
        if (idx === -1) return;

        const sugg = suggestions[idx];
        setLastAction({
            suggestionId: id,
            previousStatus: sugg.status,
            scoreBeforeAction: healthScore
        });

        setSuggestions(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], status: newStatus };
            return next;
        });

        return sugg;
    };

    const approveSuggestion = (id: string) => {
        const sugg = updateSuggestionStatus(id, 'approved');
        if (sugg) {
            setPreviousHealthScore(healthScore);
            const newScore = Math.min(100, Math.max(0, healthScore + sugg.scoreImpact));
            setHealthScore(newScore);
            setIsScoreAnimating(true);
            setTimeout(() => setIsScoreAnimating(false), 1200);

            showToast({
                type: 'success',
                message: `PR created: ${sugg.prBranch || 'fix/ai-suggestion'}`,
                action: { label: 'View PR →', onClick: () => window.open('#', '_blank') }
            });
        }
    };

    const rejectSuggestion = (id: string) => {
        updateSuggestionStatus(id, 'rejected');
        showToast({
            type: 'info',
            message: 'Suggestion rejected.',
            action: { label: 'Undo', onClick: undoLastAction }
        });
    };

    const deferSuggestion = (id: string) => {
        updateSuggestionStatus(id, 'deferred');
        showToast({
            type: 'info',
            message: 'Deferred — will resurface in 7 days.',
            action: { label: 'Undo', onClick: undoLastAction }
        });
    };

    const undoLastAction = () => {
        if (!lastAction) return;

        setSuggestions(prev => {
            const next = [...prev];
            const idx = next.findIndex(s => s.id === lastAction.suggestionId);
            if (idx !== -1) {
                next[idx] = { ...next[idx], status: lastAction.previousStatus };
            }
            return next;
        });

        setHealthScore(lastAction.scoreBeforeAction);
        setPreviousHealthScore(lastAction.scoreBeforeAction);
        setLastAction(null);
        showToast({ type: 'info', message: 'Action undone.' });
    };

    const triggerScan = () => {
        setIsScanning(true);
        setScanProgress(0);

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 5) + 3;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    setIsScanning(false);
                    if (!suggestions.find(s => s.id === SCAN_DISCOVERY.id)) {
                        setSuggestions(prev => [SCAN_DISCOVERY, ...prev]);
                        showToast({
                            type: 'info',
                            message: 'Scan complete — 1 new pattern detected.',
                            action: { label: 'View', onClick: () => setExpandedSuggestionId(SCAN_DISCOVERY.id) }
                        });
                    }
                }, 400);
            }
            setScanProgress(progress);
        }, 100);
    };

    const stats = useMemo(() => {
        let pending = 0, approved = 0, rejected = 0, deferred = 0, estimatedHoursAutoSaved = 0;
        suggestions.forEach(s => {
            if (s.status === 'pending') pending++;
            else if (s.status === 'approved') {
                approved++;
                estimatedHoursAutoSaved += s.estimatedHours;
            }
            else if (s.status === 'rejected') rejected++;
            else if (s.status === 'deferred') deferred++;
        });
        return { total: suggestions.length, pending, approved, rejected, deferred, estimatedHoursAutoSaved };
    }, [suggestions]);

    const filteredSuggestions = useMemo(() => {
        let current = suggestions;

        if (filterStatus !== 'all') {
            current = current.filter(s => s.status === filterStatus);
        }
        if (filterService !== 'all') {
            current = current.filter(s => s.serviceId === filterService);
        }
        if (filterCategory !== 'all') {
            current = current.filter(s => s.category === filterCategory);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            current = current.filter(s =>
                s.title.toLowerCase().includes(q) || s.detail.toLowerCase().includes(q)
            );
        }

        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

        return current.sort((a, b) => {
            if (sortKey === 'severity') {
                return severityOrder[a.severity] - severityOrder[b.severity];
            }
            if (sortKey === 'service') {
                return a.serviceName.localeCompare(b.serviceName);
            }
            if (sortKey === 'category') {
                return a.category.localeCompare(b.category);
            }
            // date - fallback to severity for now
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
    }, [suggestions, filterStatus, filterService, filterCategory, searchQuery, sortKey]);

    const openDrawer = (id: string) => setDrawerSuggestionId(id);
    const closeDrawer = () => setDrawerSuggestionId(null);

    return {
        suggestions,
        filteredSuggestions,
        expandedSuggestionId, setExpandedSuggestionId,
        drawerSuggestionId, openDrawer, closeDrawer,
        approveSuggestion, rejectSuggestion, deferSuggestion,
        undoLastAction, canUndo: lastAction !== null,
        filterStatus, setFilterStatus,
        filterService, setFilterService,
        filterCategory, setFilterCategory,
        searchQuery, setSearchQuery,
        sortKey, setSortKey,
        healthScore, previousHealthScore, isScoreAnimating,
        isScanning, triggerScan, scanProgress,
        activeToast, dismissToast,
        stats
    };
}
