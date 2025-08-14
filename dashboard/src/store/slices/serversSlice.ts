import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Server {
  sessionId: string;
  name: string;
  command: string;
  cwd: string;
  port?: number;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'failed';
  pid?: number;
  startedAt?: string;
  env?: Record<string, string>;
}

export interface ServersState {
  servers: Server[];
  loading: boolean;
  error: string | null;
  selectedServer: string | null;
}

const initialState: ServersState = {
  servers: [],
  loading: false,
  error: null,
  selectedServer: null,
};

const serversSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {
    setServers: (state, action: PayloadAction<Server[]>) => {
      state.servers = action.payload;
    },
    addServer: (state, action: PayloadAction<Server>) => {
      const existingIndex = state.servers.findIndex(
        (server) => server.sessionId === action.payload.sessionId
      );
      if (existingIndex >= 0) {
        state.servers[existingIndex] = action.payload;
      } else {
        state.servers.push(action.payload);
      }
    },
    updateServer: (state, action: PayloadAction<{ sessionId: string; updates: Partial<Server> }>) => {
      const index = state.servers.findIndex(
        (server) => server.sessionId === action.payload.sessionId
      );
      if (index >= 0) {
        state.servers[index] = { ...state.servers[index], ...action.payload.updates };
      }
    },
    removeServer: (state, action: PayloadAction<string>) => {
      state.servers = state.servers.filter(
        (server) => server.sessionId !== action.payload
      );
      if (state.selectedServer === action.payload) {
        state.selectedServer = null;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSelectedServer: (state, action: PayloadAction<string | null>) => {
      state.selectedServer = action.payload;
    },
    clearServers: (state) => {
      state.servers = [];
      state.selectedServer = null;
    },
  },
});

export const {
  setServers,
  addServer,
  updateServer,
  removeServer,
  setLoading,
  setError,
  setSelectedServer,
  clearServers,
} = serversSlice.actions;

export default serversSlice.reducer;