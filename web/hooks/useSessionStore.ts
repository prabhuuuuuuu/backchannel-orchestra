import { create } from 'zustand';
import { BackchannelEvent } from '@/lib/types';

interface SessionStore {
  // State
  isRecording: boolean;
  backchannels: BackchannelEvent[];
  sessionDuration: number;
  lastBackchannel?: BackchannelEvent;
  backchannelCount: number;
  isConnected: boolean;
  error?: string;
  startTime?: number;

  // Actions
  startRecording: () => void;
  stopRecording: () => void;
  addBackchannel: (backchannel: BackchannelEvent) => void;
  updateDuration: (duration: number) => void;
  setConnected: (connected: boolean) => void;
  setError: (error?: string) => void;
  resetSession: () => void;
  
  // Computed getters
  getBackchannelsByType: () => Record<string, number>;
  getAverageResponseTime: () => number;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  // Initial state
  isRecording: false,
  backchannels: [],
  sessionDuration: 0,
  lastBackchannel: undefined,
  backchannelCount: 0,
  isConnected: false,
  error: undefined,
  startTime: undefined,

  // Actions
  startRecording: () => 
    set({ 
      isRecording: true, 
      startTime: Date.now(),
      error: undefined 
    }),

  stopRecording: () => 
    set({ isRecording: false }),

  addBackchannel: (backchannel: BackchannelEvent) =>
    set((state) => ({
      backchannels: [...state.backchannels, backchannel],
      lastBackchannel: backchannel,
      backchannelCount: state.backchannelCount + 1,
    })),

  updateDuration: (duration: number) =>
    set({ sessionDuration: duration }),

  setConnected: (connected: boolean) =>
    set({ isConnected: connected }),

  setError: (error?: string) =>
    set({ error }),

  resetSession: () =>
    set({
      isRecording: false,
      backchannels: [],
      sessionDuration: 0,
      lastBackchannel: undefined,
      backchannelCount: 0,
      error: undefined,
      startTime: undefined,
    }),

  // Computed getters
  getBackchannelsByType: () => {
    const backchannels = get().backchannels;
    return backchannels.reduce((acc, bc) => {
      acc[bc.type] = (acc[bc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  },

  getAverageResponseTime: () => {
    const backchannels = get().backchannels;
    if (backchannels.length === 0) return 0;

    // Calculate time between backchannels
    const times: number[] = [];
    for (let i = 1; i < backchannels.length; i++) {
      times.push((backchannels[i].timestamp - backchannels[i - 1].timestamp) / 1000);
    }

    if (times.length === 0) return 0;
    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    return Number(avg.toFixed(2));
  },
}));