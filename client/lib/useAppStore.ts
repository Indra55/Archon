import { create } from 'zustand'

export interface Notification {
  id: number;
  text: string;
  time: string;
  severity: "red" | "amber" | "accent" | "green";
  read: boolean;
}

interface AppStore {
  isSidebarExpanded: boolean;
  setSidebarExpanded: (val: boolean) => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (val: boolean) => void;
  notifications: Notification[];
  markNotificationRead: (id: number) => void;
  unreadCount: number;
}

export const useAppStore = create<AppStore>((set) => ({
  isSidebarExpanded: false,
  setSidebarExpanded: (val) => set({ isSidebarExpanded: val }),
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (val) => set({ isCommandPaletteOpen: val }),
  notifications: [
    { id: 1, text: "PR #1847 blocked — 2 violations", time: "2hr ago", severity: "red", read: false },
    { id: 2, text: "Payment Service docs are stale", time: "1d ago", severity: "amber", read: false },
    { id: 3, text: "4 new Self-Healer suggestions", time: "2d ago", severity: "accent", read: false },
  ],
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  unreadCount: 3,
}))
