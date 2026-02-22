import { useState, useMemo, useEffect } from 'react';
import { TIMELINE_EVENTS, TimelineEvent } from '@/data/timelineMockData';

export interface TimelineHook {
    currentDate: Date;
    setCurrentDate: (d: Date) => void;
    isAtPresent: boolean;
    jumpToPresent: () => void;
    jumpToEvent: (eventId: string) => void;

    isDragging: boolean;
    setIsDragging: (v: boolean) => void;

    isCompareMode: boolean;
    toggleCompareMode: () => void;
    compareDate: Date;
    setCompareDate: (d: Date) => void;
    isCompareDragging: boolean;
    setIsCompareDragging: (v: boolean) => void;

    highlightedEventId: string | null;
    setHighlightedEventId: (id: string | null) => void;

    hoveredEventId: string | null;
    setHoveredEventId: (id: string | null) => void;

    currentEvents: TimelineEvent[];
    compareEvents: TimelineEvent[];
    startDate: Date;
    endDate: Date;
    totalDays: number;
    currentDayOffset: number;
    compareDayOffset: number;
}

export function useTimeline(): TimelineHook {
    const [currentDate, setCurrentDate] = useState<Date>(new Date('2024-01-01'));
    const [compareDate, setCompareDate] = useState<Date>(new Date('2024-01-01'));
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isCompareDragging, setIsCompareDragging] = useState(false);
    const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
    const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

    const startDate = useMemo(() => new Date('2023-01-15'), []);
    const [endDate, setEndDate] = useState<Date>(new Date('2024-01-01'));

    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setCurrentDate(new Date());
        setEndDate(new Date());
        setIsHydrated(true);
    }, []);

    const isAtPresent = useMemo(() => {
        if (!isHydrated) return true;
        return currentDate.toDateString() === new Date().toDateString();
    }, [currentDate, isHydrated]);

    const jumpToPresent = () => {
        setCurrentDate(new Date());
    };

    const jumpToEvent = (eventId: string) => {
        const event = TIMELINE_EVENTS.find(e => e.id === eventId);
        if (event) {
            setCurrentDate(new Date(event.date));
            setHighlightedEventId(event.id);
            setTimeout(() => {
                setHighlightedEventId(current => (current === event.id ? null : current));
            }, 3000);
        }
    };

    const toggleCompareMode = () => setIsCompareMode(p => !p);

    const currentEvents = useMemo(() => {
        return TIMELINE_EVENTS.filter(e => new Date(e.date) <= currentDate);
    }, [currentDate]);

    const compareEvents = useMemo(() => {
        return TIMELINE_EVENTS.filter(e => new Date(e.date) <= compareDate);
    }, [compareDate]);

    const totalDays = useMemo(() => {
        return (endDate.getTime() - startDate.getTime()) / 86400000;
    }, [startDate, endDate]);

    const currentDayOffset = useMemo(() => {
        return (currentDate.getTime() - startDate.getTime()) / 86400000;
    }, [currentDate, startDate]);

    const compareDayOffset = useMemo(() => {
        return (compareDate.getTime() - startDate.getTime()) / 86400000;
    }, [compareDate, startDate]);

    return {
        currentDate, setCurrentDate, isAtPresent, jumpToPresent, jumpToEvent,
        isDragging, setIsDragging, isCompareMode, toggleCompareMode,
        compareDate, setCompareDate, isCompareDragging, setIsCompareDragging,
        highlightedEventId, setHighlightedEventId, hoveredEventId, setHoveredEventId,
        currentEvents, compareEvents, startDate, endDate,
        totalDays, currentDayOffset, compareDayOffset
    };
}
