import { useState, useMemo } from 'react';
import { PRS, POLICIES, PRItem } from '@/data/ciEnforcerMockData';

export type ActiveTab = 'feed' | 'policies';
export type PRStatus = 'flagged' | 'passing' | 'pending';
export type FilterStatus = 'all' | 'flagged' | 'passing' | 'pending';

export interface Policy {
    id: string;
    label: string;
    description: string;
    enabled: boolean;
    group: 'documentation' | 'architecture' | 'audit';
}

export interface CIEnforcerHook {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;

    prs: PRItem[];
    expandedPRId: number | null;
    setExpandedPRId: (id: number | null) => void;
    drawerPRId: number | null;
    openDrawer: (id: number) => void;
    closeDrawer: () => void;

    filterStatus: FilterStatus;
    setFilterStatus: (s: FilterStatus) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    teamFilter: string;
    setTeamFilter: (t: string) => void;
    filteredPRs: PRItem[];

    reviewedPRIds: Set<number>;
    markReviewed: (id: number) => void;

    policies: Policy[];
    togglePolicy: (id: string) => void;
    driftSensitivity: 'low' | 'medium' | 'high';
    setDriftSensitivity: (s: 'low' | 'medium' | 'high') => void;
    auditLogEnabled: boolean;
    toggleAuditLog: () => void;
    lastSavedPolicyId: string | null;

    stats: {
        totalThisWeek: number;
        passing: number;
        passingPercent: number;
        flagged: number;
        flaggedPercent: number;
        critical: number;
    };
}

export function useCIEnforcer(): CIEnforcerHook {
    const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
    const [prs] = useState<PRItem[]>(PRS);

    const [expandedPRId, setExpandedPRId] = useState<number | null>(null);
    const [drawerPRId, setDrawerPRId] = useState<number | null>(null);

    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [teamFilter, setTeamFilter] = useState('All Teams');

    const [reviewedPRIds, setReviewedPRIds] = useState<Set<number>>(new Set());

    const [policies, setPolicies] = useState<Policy[]>(POLICIES);
    const [driftSensitivity, setDriftSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
    const [auditLogEnabled, setAuditLogEnabled] = useState(true);
    const [lastSavedPolicyId, setLastSavedPolicyId] = useState<string | null>(null);

    const filteredPRs = useMemo(() => {
        return prs.filter(pr => {
            if (filterStatus !== 'all' && pr.status !== filterStatus) return false;
            if (teamFilter !== 'All Teams' && pr.team !== teamFilter) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!pr.title.toLowerCase().includes(query) && !pr.number.toString().includes(query)) {
                    return false;
                }
            }
            return true;
        });
    }, [prs, filterStatus, teamFilter, searchQuery]);

    const stats = useMemo(() => {
        const totalThisWeek = 42; // mock stable stat
        const passing = 31;
        const flagged = 11;
        const critical = 3;

        return {
            totalThisWeek,
            passing,
            passingPercent: Math.round((passing / totalThisWeek) * 100),
            flagged,
            flaggedPercent: Math.round((flagged / totalThisWeek) * 100),
            critical,
        };
    }, []);

    const openDrawer = (id: number) => setDrawerPRId(id);
    const closeDrawer = () => setDrawerPRId(null);

    const markReviewed = (id: number) => {
        setReviewedPRIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    const togglePolicy = (id: string) => {
        setPolicies(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
        setLastSavedPolicyId(id);
        setTimeout(() => {
            setLastSavedPolicyId(prev => (prev === id ? null : prev));
        }, 2000);
    };

    const toggleAuditLog = () => {
        setAuditLogEnabled(prev => !prev);
    };

    return {
        activeTab,
        setActiveTab,
        prs,
        expandedPRId,
        setExpandedPRId,
        drawerPRId,
        openDrawer,
        closeDrawer,
        filterStatus,
        setFilterStatus,
        searchQuery,
        setSearchQuery,
        teamFilter,
        setTeamFilter,
        filteredPRs,
        reviewedPRIds,
        markReviewed,
        policies,
        togglePolicy,
        driftSensitivity,
        setDriftSensitivity,
        auditLogEnabled,
        toggleAuditLog,
        lastSavedPolicyId,
        stats,
    };
}
