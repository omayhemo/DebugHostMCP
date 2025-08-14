import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LogEntry {
  id: string;
  sessionId: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface LogsState {
  logs: LogEntry[];
  filteredLogs: LogEntry[];
  loading: boolean;
  error: string | null;
  filters: {
    sessionId: string | null;
    level: string | null;
    search: string;
    startTime: string | null;
    endTime: string | null;
  };
  autoScroll: boolean;
  maxLogEntries: number;
}

const initialState: LogsState = {
  logs: [],
  filteredLogs: [],
  loading: false,
  error: null,
  filters: {
    sessionId: null,
    level: null,
    search: '',
    startTime: null,
    endTime: null,
  },
  autoScroll: true,
  maxLogEntries: 10000, // Support 10,000+ log entries as per AC 25
};

const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    addLogs: (state, action: PayloadAction<LogEntry[]>) => {
      state.logs.push(...action.payload);
      // Keep only the last maxLogEntries
      if (state.logs.length > state.maxLogEntries) {
        state.logs = state.logs.slice(-state.maxLogEntries);
      }
    },
    addLog: (state, action: PayloadAction<LogEntry>) => {
      state.logs.push(action.payload);
      // Keep only the last maxLogEntries
      if (state.logs.length > state.maxLogEntries) {
        state.logs = state.logs.slice(-state.maxLogEntries);
      }
    },
    clearLogs: (state) => {
      state.logs = [];
      state.filteredLogs = [];
    },
    clearLogsForSession: (state, action: PayloadAction<string>) => {
      state.logs = state.logs.filter(log => log.sessionId !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<LogsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        sessionId: null,
        level: null,
        search: '',
        startTime: null,
        endTime: null,
      };
    },
    setAutoScroll: (state, action: PayloadAction<boolean>) => {
      state.autoScroll = action.payload;
    },
    setMaxLogEntries: (state, action: PayloadAction<number>) => {
      state.maxLogEntries = action.payload;
      // Trim logs if needed
      if (state.logs.length > action.payload) {
        state.logs = state.logs.slice(-action.payload);
      }
    },
    applyFilters: (state) => {
      let filtered = [...state.logs];
      
      if (state.filters.sessionId) {
        filtered = filtered.filter(log => log.sessionId === state.filters.sessionId);
      }
      
      if (state.filters.level) {
        filtered = filtered.filter(log => log.level === state.filters.level);
      }
      
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase();
        filtered = filtered.filter(log => 
          log.message.toLowerCase().includes(search) ||
          log.source?.toLowerCase().includes(search)
        );
      }
      
      if (state.filters.startTime) {
        filtered = filtered.filter(log => log.timestamp >= state.filters.startTime!);
      }
      
      if (state.filters.endTime) {
        filtered = filtered.filter(log => log.timestamp <= state.filters.endTime!);
      }
      
      state.filteredLogs = filtered;
    },
  },
});

export const {
  addLogs,
  addLog,
  clearLogs,
  clearLogsForSession,
  setLoading,
  setError,
  setFilters,
  resetFilters,
  setAutoScroll,
  setMaxLogEntries,
  applyFilters,
} = logsSlice.actions;

export default logsSlice.reducer;