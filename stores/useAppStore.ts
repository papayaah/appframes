import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'auto';

interface AppState {
  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  // Welcome modal dismissed
  welcomeModalDismissed: boolean;
  dismissWelcomeModal: () => void;
  resetWelcomeModal: () => void;

  // Feature tips
  dismissedTips: string[];
  dismissTip: (tipKey: string) => void;
  isTipDismissed: (tipKey: string) => boolean;
  resetTips: () => void;

  // Tutorial state
  tutorialStep: number;
  tutorialActive: boolean;
  tutorialCompleted: boolean;
  setTutorialStep: (step: number) => void;
  startTutorial: () => void;
  stopTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme - default to auto
      theme: 'auto',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const current = get().theme;
        if (current === 'auto') {
          // When leaving auto, go to opposite of current system preference
          const systemIsDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
          set({ theme: systemIsDark ? 'light' : 'dark' });
        } else if (current === 'light') {
          set({ theme: 'dark' });
        } else {
          set({ theme: 'auto' });
        }
      },

      // Welcome modal
      welcomeModalDismissed: false,
      dismissWelcomeModal: () => set({ welcomeModalDismissed: true }),
      resetWelcomeModal: () => set({ welcomeModalDismissed: false }),

      // Feature tips
      dismissedTips: [],
      dismissTip: (tipKey) => set((state) => ({
        dismissedTips: state.dismissedTips.includes(tipKey)
          ? state.dismissedTips
          : [...state.dismissedTips, tipKey],
      })),
      isTipDismissed: (tipKey) => get().dismissedTips.includes(tipKey),
      resetTips: () => set({ dismissedTips: [] }),

      // Tutorial state
      tutorialStep: 0,
      tutorialActive: false,
      tutorialCompleted: false,
      setTutorialStep: (step) => set({ tutorialStep: step }),
      startTutorial: () => set({ tutorialActive: true, tutorialStep: 1, welcomeModalDismissed: true, tutorialCompleted: false }),
      stopTutorial: () => set({ tutorialActive: false }),
      completeTutorial: () => set({ tutorialActive: false, tutorialStep: 0, tutorialCompleted: true }),
      resetTutorial: () => set({ tutorialActive: false, tutorialStep: 0, tutorialCompleted: false, welcomeModalDismissed: false }),
    }),
    {
      name: 'appframes-storage',
    }
  )
);
