import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Operation {
  id: string;
  projectId: string;
  type: 'start' | 'stop' | 'restart' | 'configure' | 'health';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: number;
  error?: string;
  progress?: number;
}

export interface ConfigChange {
  projectId: string;
  changes: {
    environment?: Record<string, string>;
    volumes?: string[];
    ports?: Record<string, number>;
    network?: string;
  };
  validated: boolean;
  errors?: string[];
}

export interface BatchOperation {
  id: string;
  projectIds: string[];
  action: 'start' | 'stop' | 'restart';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'partial';
  progress: number;
  completed: string[];
  failed: string[];
  timestamp: number;
}

export interface ProjectControlsState {
  activeOperations: Record<string, Operation>;
  configChanges: Record<string, ConfigChange>;
  batchQueue: BatchOperation[];
  operationHistory: Operation[];
  selectedProjects: string[];
  isOfflineMode: boolean;
  queuedActions: Operation[];
}

const initialState: ProjectControlsState = {
  activeOperations: {},
  configChanges: {},
  batchQueue: [],
  operationHistory: [],
  selectedProjects: [],
  isOfflineMode: false,
  queuedActions: []
};

const projectControlsSlice = createSlice({
  name: 'projectControls',
  initialState,
  reducers: {
    startOperation: (state, action: PayloadAction<Operation>) => {
      state.activeOperations[action.payload.projectId] = action.payload;
    },
    updateOperation: (state, action: PayloadAction<{ projectId: string; updates: Partial<Operation> }>) => {
      const { projectId, updates } = action.payload;
      if (state.activeOperations[projectId]) {
        state.activeOperations[projectId] = {
          ...state.activeOperations[projectId],
          ...updates
        };
      }
    },
    completeOperation: (state, action: PayloadAction<{ projectId: string; status: 'completed' | 'failed'; error?: string }>) => {
      const { projectId, status, error } = action.payload;
      const operation = state.activeOperations[projectId];
      if (operation) {
        operation.status = status;
        if (error) operation.error = error;
        state.operationHistory.push(operation);
        delete state.activeOperations[projectId];
      }
    },
    setConfigChange: (state, action: PayloadAction<ConfigChange>) => {
      state.configChanges[action.payload.projectId] = action.payload;
    },
    validateConfigChange: (state, action: PayloadAction<{ projectId: string; validated: boolean; errors?: string[] }>) => {
      const { projectId, validated, errors } = action.payload;
      if (state.configChanges[projectId]) {
        state.configChanges[projectId].validated = validated;
        state.configChanges[projectId].errors = errors;
      }
    },
    clearConfigChange: (state, action: PayloadAction<string>) => {
      delete state.configChanges[action.payload];
    },
    addBatchOperation: (state, action: PayloadAction<BatchOperation>) => {
      state.batchQueue.push(action.payload);
    },
    updateBatchOperation: (state, action: PayloadAction<{ id: string; updates: Partial<BatchOperation> }>) => {
      const { id, updates } = action.payload;
      const index = state.batchQueue.findIndex(op => op.id === id);
      if (index !== -1) {
        state.batchQueue[index] = {
          ...state.batchQueue[index],
          ...updates
        };
      }
    },
    completeBatchOperation: (state, action: PayloadAction<string>) => {
      state.batchQueue = state.batchQueue.filter(op => op.id !== action.payload);
    },
    toggleProjectSelection: (state, action: PayloadAction<string>) => {
      const projectId = action.payload;
      const index = state.selectedProjects.indexOf(projectId);
      if (index === -1) {
        state.selectedProjects.push(projectId);
      } else {
        state.selectedProjects.splice(index, 1);
      }
    },
    selectAllProjects: (state, action: PayloadAction<string[]>) => {
      state.selectedProjects = action.payload;
    },
    clearProjectSelection: (state) => {
      state.selectedProjects = [];
    },
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.isOfflineMode = action.payload;
    },
    queueAction: (state, action: PayloadAction<Operation>) => {
      state.queuedActions.push(action.payload);
    },
    processQueuedActions: (state) => {
      state.queuedActions.forEach(action => {
        state.activeOperations[action.projectId] = action;
      });
      state.queuedActions = [];
    },
    clearOperationHistory: (state) => {
      state.operationHistory = [];
    }
  }
});

export const {
  startOperation,
  updateOperation,
  completeOperation,
  setConfigChange,
  validateConfigChange,
  clearConfigChange,
  addBatchOperation,
  updateBatchOperation,
  completeBatchOperation,
  toggleProjectSelection,
  selectAllProjects,
  clearProjectSelection,
  setOfflineMode,
  queueAction,
  processQueuedActions,
  clearOperationHistory
} = projectControlsSlice.actions;

export default projectControlsSlice.reducer;