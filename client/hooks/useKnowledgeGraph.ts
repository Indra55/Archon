import { useState, useMemo, useRef, useEffect } from 'react';
import { SERVICES, INFRA, EDGES } from '@/data/knowledgeGraphMockData';

export type ViewMode = 'graph' | 'health';
export type HealthStatus = 'healthy' | 'stale' | 'undocumented';
export type ServiceType = 'microservice' | 'database' | 'queue' | 'gateway';
export type SortKey = 'name' | 'health' | 'docCoverage' | 'lastUpdated' | 'missingCount';

export interface KnowledgeGraphHook {
    viewMode: ViewMode;
    setViewMode: (m: ViewMode) => void;

    isFilterPanelOpen: boolean;
    toggleFilterPanel: () => void;
    drawerServiceId: string | null;
    openDrawer: (id: string) => void;
    closeDrawer: () => void;
    spotlightNodeId: string | null;
    setSpotlightNodeId: (id: string | null) => void;

    searchQuery: string;
    setSearchQuery: (q: string) => void;
    teamFilters: string[];
    toggleTeamFilter: (team: string) => void;
    healthFilters: HealthStatus[];
    toggleHealthFilter: (s: HealthStatus) => void;
    typeFilters: ServiceType[];
    toggleTypeFilter: (t: ServiceType) => void;
    isFilterActive: boolean;
    clearAllFilters: () => void;

    filteredServiceIds: string[];
    visibleNodeIds: Set<string>;

    sortKey: SortKey;
    sortDirection: 'asc' | 'desc';
    setSort: (key: SortKey) => void;
    serviceRowRefs: React.MutableRefObject<Record<string, HTMLTableRowElement | null>>;
    apiData: { nodes: any[], edges: any[] } | null;
    loading: boolean;
}

export function useKnowledgeGraph(): KnowledgeGraphHook {
    const [viewMode, setViewMode] = useState<ViewMode>('graph');
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [drawerServiceId, setDrawerServiceId] = useState<string | null>(null);
    const [spotlightNodeId, setSpotlightNodeId] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [teamFilters, setTeamFilters] = useState<string[]>([]); // empty means all
    const [healthFilters, setHealthFilters] = useState<HealthStatus[]>([]); // empty means all
    const [typeFilters, setTypeFilters] = useState<ServiceType[]>([]); // empty means all

    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const serviceRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

    const isFilterActive = searchQuery !== '' || teamFilters.length > 0 || healthFilters.length > 0 || typeFilters.length > 0;

    const [apiData, setApiData] = useState<{ nodes: any[], edges: any[] } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch('/api/knowledge/graph')
            .then(res => res.json())
            .then(data => {
                setApiData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch graph data:', err);
                setLoading(false);
            });
    }, []);

    const toggleFilterPanel = () => setIsFilterPanelOpen(prev => !prev);
    const openDrawer = (id: string) => setDrawerServiceId(id);
    const closeDrawer = () => setDrawerServiceId(null);

    const toggleTeamFilter = (team: string) => {
        setTeamFilters(prev => prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]);
    };

    const toggleHealthFilter = (status: HealthStatus) => {
        setHealthFilters(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    };

    const toggleTypeFilter = (type: ServiceType) => {
        setTypeFilters(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    const clearAllFilters = () => {
        setSearchQuery('');
        setTeamFilters([]);
        setHealthFilters([]);
        setTypeFilters([]);
    };

    const setSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc'); // Default new sort to desc, or asc depending on preference
        }
    };

    const filteredServiceIds = useMemo(() => {
        const q = searchQuery.toLowerCase();
        const result: string[] = [];

        // Filter services
        for (const service of SERVICES) {
            let pass = true;
            if (q && !service.name.toLowerCase().includes(q) && !service.id.toLowerCase().includes(q)) pass = false;
            if (teamFilters.length > 0 && !teamFilters.includes(service.team)) pass = false;
            if (healthFilters.length > 0 && !healthFilters.includes(service.health)) pass = false;
            if (typeFilters.length > 0 && !typeFilters.includes(service.type as ServiceType)) pass = false;

            if (pass) result.push(service.id);
        }

        // Filter infra
        for (const infra of INFRA) {
            let pass = true;
            if (q && !infra.name.toLowerCase().includes(q) && !infra.id.toLowerCase().includes(q)) pass = false;
            // Infra doesn't have team/health, but has type
            if (teamFilters.length > 0) pass = false;
            if (healthFilters.length > 0) pass = false;
            if (typeFilters.length > 0 && !typeFilters.includes(infra.type as ServiceType)) pass = false;

            if (pass) result.push(infra.id);
        }

        return result;
    }, [searchQuery, teamFilters, healthFilters, typeFilters]);

    const visibleNodeIds = useMemo(() => {
        if (!isFilterActive) return new Set<string>(); // Empty means show all

        const visible = new Set<string>(filteredServiceIds);

        // Add neighbors
        for (const edge of EDGES) {
            if (filteredServiceIds.includes(edge.source) || filteredServiceIds.includes(edge.target)) {
                visible.add(edge.source);
                visible.add(edge.target);
            }
        }

        return visible;
    }, [isFilterActive, filteredServiceIds]);

    return {
        viewMode,
        setViewMode,
        isFilterPanelOpen,
        toggleFilterPanel,
        drawerServiceId,
        openDrawer,
        closeDrawer,
        spotlightNodeId,
        setSpotlightNodeId,
        searchQuery,
        setSearchQuery,
        teamFilters,
        toggleTeamFilter,
        healthFilters,
        toggleHealthFilter,
        typeFilters,
        toggleTypeFilter,
        isFilterActive,
        clearAllFilters,
        filteredServiceIds,
        visibleNodeIds,
        sortKey,
        sortDirection,
        setSort,
        serviceRowRefs,
        apiData,
        loading
    };
}
