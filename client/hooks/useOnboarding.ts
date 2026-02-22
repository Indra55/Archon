import { useState, useEffect, useMemo, useCallback } from 'react';
import { EngineerRole, OnboardingModule, ROLES, MODULES } from '@/data/onboardingMockData';

export type TaskStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed';

interface OnboardingState {
    role: EngineerRole | null;
    completedTasks: string[];
}

export interface OnboardingHook {
    activeRole: EngineerRole | null;
    setActiveRole: (role: EngineerRole) => void;
    hasSelectedRole: boolean;
    setHasSelectedRole: (val: boolean) => void;

    activeModuleId: string;
    setActiveModuleId: (id: string) => void;
    getModuleStatus: (moduleId: string) => ModuleStatus;
    modulesForRole: OnboardingModule[];

    activeTaskId: string | null;
    openTask: (taskId: string) => void;
    closeTask: () => void;
    completeTask: (taskId: string) => void;
    getTaskStatus: (taskId: string) => TaskStatus;
    completedTaskIds: Set<string>;

    overallProgress: number;
    currentModuleProgress: number;
    totalTasksForRole: number;
    completedTasksForRole: number;
    estimatedDaysRemaining: number;

    showCelebration: boolean;
    dismissCelebration: () => void;

    resetProgress: () => void;
}

export function useOnboarding(): OnboardingHook {
    const [activeRole, setActiveRole] = useState<EngineerRole | null>('backend');
    const [hasSelectedRole, setHasSelectedRole] = useState(true);
    const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
    const [activeModuleId, setActiveModuleId] = useState<string>('');
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('kachow-onboarding-state');
        if (saved) {
            try {
                const parsed: OnboardingState = JSON.parse(saved);
                if (parsed.role) {
                    setActiveRole(parsed.role);
                    setHasSelectedRole(true);
                }
                if (parsed.completedTasks) {
                    setCompletedTaskIds(new Set(parsed.completedTasks));
                }
            } catch (e) {
                console.error('Failed to parse onboarding state', e);
            }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        const state: OnboardingState = {
            role: activeRole,
            completedTasks: Array.from(completedTaskIds),
        };
        localStorage.setItem('kachow-onboarding-state', JSON.stringify(state));
    }, [activeRole, completedTaskIds]);

    const modulesForRole = useMemo(() => {
        if (!activeRole) return [];
        const roleDef = ROLES.find((r) => r.id === activeRole);
        if (!roleDef) return [];
        return roleDef.moduleIds
            .map((id) => MODULES.find((m) => m.id === id))
            .filter(Boolean) as OnboardingModule[];
    }, [activeRole]);

    useEffect(() => {
        if (modulesForRole.length > 0 && !activeModuleId) {
            setActiveModuleId(modulesForRole[0].id);
        }
    }, [modulesForRole, activeModuleId]);

    const getModuleStatus = useCallback((moduleId: string): ModuleStatus => {
        const moduleIndex = modulesForRole.findIndex(m => m.id === moduleId);
        if (moduleIndex === -1) return 'locked';

        const mod = modulesForRole[moduleIndex];
        const moduleTasks = mod.tasks;
        const completedInModule = moduleTasks.filter(t => completedTaskIds.has(t.id)).length;

        if (completedInModule === moduleTasks.length && moduleTasks.length > 0) return 'completed';

        // Must check previous module
        if (moduleIndex > 0) {
            const prevMod = modulesForRole[moduleIndex - 1];
            const prevModTasks = prevMod.tasks;
            const prevCompleted = prevModTasks.filter(t => completedTaskIds.has(t.id)).length;
            if (prevCompleted < prevModTasks.length) return 'locked';
        }

        if (completedInModule > 0) return 'in_progress';
        return 'available';
    }, [modulesForRole, completedTaskIds]);

    const getTaskStatus = useCallback((taskId: string): TaskStatus => {
        if (completedTaskIds.has(taskId)) return 'completed';

        const mod = modulesForRole.find(m => m.tasks.some(t => t.id === taskId));
        if (!mod) return 'locked';

        const modStatus = getModuleStatus(mod.id);
        if (modStatus === 'locked') return 'locked';

        const taskIndex = mod.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === 0) {
            return activeTaskId === taskId ? 'in_progress' : 'available';
        }

        // Previous tasks in module must be completed
        for (let i = 0; i < taskIndex; i++) {
            if (!completedTaskIds.has(mod.tasks[i].id)) return 'locked';
        }

        return activeTaskId === taskId ? 'in_progress' : 'available';
    }, [modulesForRole, completedTaskIds, getModuleStatus, activeTaskId]);

    const completeTask = useCallback((taskId: string) => {
        setCompletedTaskIds(prev => {
            const next = new Set(prev);
            next.add(taskId);
            return next;
        });

        // Check if this completes the module
        const mod = modulesForRole.find(m => m.tasks.some(t => t.id === taskId));
        if (mod) {
            const allTasks = mod.tasks;
            const willBeCompletedInModule = allTasks.filter(t => completedTaskIds.has(t.id) || t.id === taskId).length;
            if (willBeCompletedInModule === allTasks.length) {
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 4000);
            }
        }
    }, [modulesForRole, completedTaskIds]);

    const totalTasksForRole = useMemo(() => {
        return modulesForRole.reduce((sum, mod) => sum + mod.tasks.length, 0);
    }, [modulesForRole]);

    const completedTasksForRole = useMemo(() => {
        return modulesForRole.reduce((sum, mod) => sum + mod.tasks.filter(t => completedTaskIds.has(t.id)).length, 0);
    }, [modulesForRole, completedTaskIds]);

    const overallProgress = totalTasksForRole === 0 ? 0 : Math.round((completedTasksForRole / totalTasksForRole) * 100);

    const currentModuleProgress = Math.round(useMemo(() => {
        const mod = modulesForRole.find(m => m.id === activeModuleId);
        if (!mod) return 0;
        const completed = mod.tasks.filter(t => completedTaskIds.has(t.id)).length;
        return mod.tasks.length === 0 ? 0 : (completed / mod.tasks.length) * 100;
    }, [activeModuleId, modulesForRole, completedTaskIds]));

    const estimatedDaysRemaining = Math.max(0, Math.ceil((totalTasksForRole - completedTasksForRole) / 3));

    const resetProgress = useCallback(() => {
        setCompletedTaskIds(new Set());
        setHasSelectedRole(false);
        setActiveRole(null);
        setActiveModuleId('');
        setActiveTaskId(null);
        localStorage.removeItem('kachow-onboarding-state');
    }, []);

    return {
        activeRole,
        setActiveRole,
        hasSelectedRole,
        setHasSelectedRole,
        activeModuleId,
        setActiveModuleId,
        getModuleStatus,
        modulesForRole,
        activeTaskId,
        openTask: setActiveTaskId,
        closeTask: () => setActiveTaskId(null),
        completeTask,
        getTaskStatus,
        completedTaskIds,
        overallProgress,
        currentModuleProgress,
        totalTasksForRole,
        completedTasksForRole,
        estimatedDaysRemaining,
        showCelebration,
        dismissCelebration: () => setShowCelebration(false),
        resetProgress,
    };
}
