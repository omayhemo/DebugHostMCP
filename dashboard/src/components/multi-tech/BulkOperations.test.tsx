/**
 * Bulk Operations & Safety Controls Test Suite
 * 
 * Sprint 7 - Story 3.9: Bulk Operations & Safety Controls (5 story points)
 * 
 * Test suite for validating the bulk operations components and their integration
 * with the Agent Safety Framework for comprehensive batch process management.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BulkOperationsPanel } from './BulkOperationsPanel';
import { SafetyConfirmationDialog } from './SafetyConfirmationDialog';
import { ProcessSelectionToolbar } from './ProcessSelectionToolbar';
import { AuditTrailDisplay } from './AuditTrailDisplay';
import multiTechDashboardSlice from '../../store/slices/multiTechDashboardSlice';
import uiSlice from '../../store/slices/uiSlice';
import authSlice from '../../store/slices/authSlice';
import { DiscoveredProcess, TechStack, RiskLevel, BulkSafetyEvaluation, ImpactAssessment } from '../../types';

// Mock store setup
const createMockStore = (initialState: any = {}) => {
  return configureStore({
    reducer: {
      multiTechDashboard: multiTechDashboardSlice,
      ui: uiSlice,
      auth: authSlice,
    },
    preloadedState: {
      auth: {
        user: { id: 'test-user', name: 'Test User', role: 'admin' },
        isAuthenticated: true,
        ...initialState.auth
      },
      multiTechDashboard: {
        processesByTechStack: { nodejs: [], php: [], python: [], static: [], docker: [] },
        ui: { activeTab: 'all', selectedProcesses: [], bulkActionMode: false, filter: {}, sort: { field: 'pid', direction: 'asc' }, showDetails: false },
        ...initialState.multiTechDashboard
      },
      ui: {
        notifications: [],
        ...initialState.ui
      }
    }
  });
};

// Mock process data
const mockProcesses: DiscoveredProcess[] = [
  {
    pid: 1234,
    port: 3000,
    command: 'node server.js',
    techStack: 'nodejs',
    category: 'registered',
    correlationStatus: 'registered',
    status: 'running',
    workspace: 'test-project'
  },
  {
    pid: 5678,
    port: 8080,
    command: 'php artisan serve',
    techStack: 'php',
    category: 'rogue',
    correlationStatus: 'rogue',
    status: 'running',
    rogueReason: 'Process outside known workspaces'
  },
  {
    pid: 9999,
    command: 'suspicious-process',
    techStack: 'nodejs',
    category: 'rogue',
    correlationStatus: 'rogue',
    status: 'running'
  }
];

// Mock safety evaluation
const mockSafetyEvaluation: BulkSafetyEvaluation = {
  overallRisk: 'medium' as RiskLevel,
  processEvaluations: [],
  aggregateImpact: {} as ImpactAssessment,
  requiredConfirmations: ['Confirm process termination', 'Confirm rogue process operation'],
  auditRequired: true
};

// Mock impact assessment
const mockImpactAssessment: ImpactAssessment = {
  affectedWorkspaces: ['test-project'],
  processCount: 2,
  estimatedDowntime: '5-10 seconds',
  dependentServices: ['Node.js Server', 'PHP Application'],
  rollbackPlan: 'Processes can be restarted manually',
  riskFactors: ['Rogue processes detected', 'Multiple workspaces affected']
};

describe('Bulk Operations & Safety Controls', () => {
  describe('BulkOperationsPanel', () => {
    it('renders when processes are selected', () => {
      const store = createMockStore();
      const mockBulkAction = jest.fn();
      const mockClearSelection = jest.fn();
      const mockShowAuditTrail = jest.fn();

      render(
        <Provider store={store}>
          <BulkOperationsPanel
            selectedProcesses={['1234', '5678']}
            processes={mockProcesses}
            techStack="all"
            onBulkAction={mockBulkAction}
            onClearSelection={mockClearSelection}
            onShowAuditTrail={mockShowAuditTrail}
          />
        </Provider>
      );

      expect(screen.getByText('Bulk Operations & Safety Controls')).toBeInTheDocument();
      expect(screen.getByText('2 processes selected')).toBeInTheDocument();
    });

    it('does not render when no processes are selected', () => {
      const store = createMockStore();
      const mockBulkAction = jest.fn();
      const mockClearSelection = jest.fn();
      const mockShowAuditTrail = jest.fn();

      const { container } = render(
        <Provider store={store}>
          <BulkOperationsPanel
            selectedProcesses={[]}
            processes={mockProcesses}
            techStack="all"
            onBulkAction={mockBulkAction}
            onClearSelection={mockClearSelection}
            onShowAuditTrail={mockShowAuditTrail}
          />
        </Provider>
      );

      expect(container.firstChild).toBeNull();
    });

    it('shows risk indicators for dangerous processes', () => {
      const store = createMockStore();
      const mockBulkAction = jest.fn();
      const mockClearSelection = jest.fn();
      const mockShowAuditTrail = jest.fn();

      render(
        <Provider store={store}>
          <BulkOperationsPanel
            selectedProcesses={['5678', '9999']} // Both rogue processes
            processes={mockProcesses}
            techStack="all"
            onBulkAction={mockBulkAction}
            onClearSelection={mockClearSelection}
            onShowAuditTrail={mockShowAuditTrail}
          />
        </Provider>
      );

      expect(screen.getByText(/High-risk processes detected/)).toBeInTheDocument();
      expect(screen.getByText(/Rogue processes/)).toBeInTheDocument();
    });

    it('shows emergency override toggle for admin users', () => {
      const store = createMockStore({
        auth: { user: { id: 'admin', name: 'Admin User', role: 'admin' } }
      });
      const mockBulkAction = jest.fn();
      const mockClearSelection = jest.fn();
      const mockShowAuditTrail = jest.fn();

      render(
        <Provider store={store}>
          <BulkOperationsPanel
            selectedProcesses={['1234']}
            processes={mockProcesses}
            techStack="all"
            onBulkAction={mockBulkAction}
            onClearSelection={mockClearSelection}
            onShowAuditTrail={mockShowAuditTrail}
          />
        </Provider>
      );

      expect(screen.getByText(/Override OFF/)).toBeInTheDocument();
    });
  });

  describe('SafetyConfirmationDialog', () => {
    it('renders safety confirmation for high-risk operations', () => {
      render(
        <SafetyConfirmationDialog
          operation="terminate"
          evaluation={mockSafetyEvaluation}
          impact={mockImpactAssessment}
          processes={mockProcesses.slice(0, 2)}
          emergencyOverrideMode={false}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(screen.getByText('Safety Confirmation Required')).toBeInTheDocument();
      expect(screen.getByText('Terminate Processes • 2 processes')).toBeInTheDocument();
      expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    });

    it('shows required confirmations checklist', () => {
      render(
        <SafetyConfirmationDialog
          operation="terminate"
          evaluation={mockSafetyEvaluation}
          impact={mockImpactAssessment}
          processes={mockProcesses.slice(0, 2)}
          emergencyOverrideMode={false}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(screen.getByText('Required Confirmations')).toBeInTheDocument();
      expect(screen.getByText('Confirm process termination')).toBeInTheDocument();
      expect(screen.getByText('Confirm rogue process operation')).toBeInTheDocument();
    });

    it('displays emergency override warning when active', () => {
      render(
        <SafetyConfirmationDialog
          operation="terminate"
          evaluation={mockSafetyEvaluation}
          impact={mockImpactAssessment}
          processes={mockProcesses.slice(0, 2)}
          emergencyOverrideMode={true}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(screen.getByText('Emergency Override Active')).toBeInTheDocument();
      expect(screen.getByText('Safety checks are bypassed. Operation will proceed without validation.')).toBeInTheDocument();
    });
  });

  describe('ProcessSelectionToolbar', () => {
    it('renders selection statistics', () => {
      render(
        <ProcessSelectionToolbar
          processes={mockProcesses}
          selectedProcesses={['1234', '5678']}
          techStack="all"
          onProcessSelectAll={jest.fn()}
          onProcessSelect={jest.fn()}
          onClearSelection={jest.fn()}
        />
      );

      expect(screen.getByText('2 of 3 selected')).toBeInTheDocument();
    });

    it('shows quick selection presets', async () => {
      render(
        <ProcessSelectionToolbar
          processes={mockProcesses}
          selectedProcesses={[]}
          techStack="all"
          onProcessSelectAll={jest.fn()}
          onProcessSelect={jest.fn()}
          onClearSelection={jest.fn()}
        />
      );

      // Show advanced filters
      fireEvent.click(screen.getByText(/Show Filters/));

      await waitFor(() => {
        expect(screen.getByText('Quick Selection Presets')).toBeInTheDocument();
        expect(screen.getByText('All Processes')).toBeInTheDocument();
        expect(screen.getByText('Running Only')).toBeInTheDocument();
        expect(screen.getByText('Rogue Only')).toBeInTheDocument();
      });
    });
  });

  describe('AuditTrailDisplay', () => {
    it('renders audit trail when visible', () => {
      render(
        <AuditTrailDisplay
          isVisible={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('Operation Audit Trail')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive safety and operation logging')).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
      const { container } = render(
        <AuditTrailDisplay
          isVisible={false}
          onClose={jest.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('shows filter options', () => {
      render(
        <AuditTrailDisplay
          isVisible={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByDisplayValue('All Operations')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Decisions')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Risk Levels')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Last Week')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('processes selection workflow', async () => {
      const store = createMockStore();
      const mockBulkAction = jest.fn();

      render(
        <Provider store={store}>
          <div>
            <ProcessSelectionToolbar
              processes={mockProcesses}
              selectedProcesses={['1234', '5678']}
              techStack="all"
              onProcessSelectAll={jest.fn()}
              onProcessSelect={jest.fn()}
              onClearSelection={jest.fn()}
            />
            <BulkOperationsPanel
              selectedProcesses={['1234', '5678']}
              processes={mockProcesses}
              techStack="all"
              onBulkAction={mockBulkAction}
              onClearSelection={jest.fn()}
              onShowAuditTrail={jest.fn()}
            />
          </div>
        </Provider>
      );

      // Verify both components show consistent selection count
      expect(screen.getByText('2 of 3 selected')).toBeInTheDocument();
      expect(screen.getByText('2 processes selected')).toBeInTheDocument();
    });

    it('safety confirmation workflow for dangerous operations', async () => {
      const mockOnConfirm = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <SafetyConfirmationDialog
          operation="terminate"
          evaluation={{
            ...mockSafetyEvaluation,
            overallRisk: 'high' as RiskLevel
          }}
          impact={mockImpactAssessment}
          processes={mockProcesses.filter(p => p.category === 'rogue')}
          emergencyOverrideMode={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // For high-risk operations, should require typing CONFIRM
      expect(screen.getByPlaceholderText('Type CONFIRM to proceed')).toBeInTheDocument();
      
      // Confirm button should be disabled initially
      const confirmButton = screen.getByText('Confirm & Execute');
      expect(confirmButton).toBeDisabled();

      // Type confirmation text
      fireEvent.change(screen.getByPlaceholderText('Type CONFIRM to proceed'), {
        target: { value: 'CONFIRM' }
      });

      await waitFor(() => {
        expect(confirmButton).toBeEnabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles bulk operation failures gracefully', async () => {
      const store = createMockStore();
      const mockBulkAction = jest.fn().mockRejectedValue(new Error('Operation failed'));

      render(
        <Provider store={store}>
          <BulkOperationsPanel
            selectedProcesses={['1234']}
            processes={mockProcesses}
            techStack="all"
            onBulkAction={mockBulkAction}
            onClearSelection={jest.fn()}
            onShowAuditTrail={jest.fn()}
          />
        </Provider>
      );

      // This test would require more complex mocking to fully test error handling
      expect(screen.getByText('Bulk Operations & Safety Controls')).toBeInTheDocument();
    });
  });
});

/**
 * Test Data and Utilities
 */
export const BulkOperationsTestUtils = {
  createMockProcess: (overrides: Partial<DiscoveredProcess> = {}): DiscoveredProcess => ({
    pid: 1234,
    port: 3000,
    command: 'node server.js',
    techStack: 'nodejs' as TechStack,
    category: 'registered',
    correlationStatus: 'registered',
    status: 'running',
    ...overrides
  }),

  createMockSafetyEvaluation: (overrides: Partial<BulkSafetyEvaluation> = {}): BulkSafetyEvaluation => ({
    overallRisk: 'medium' as RiskLevel,
    processEvaluations: [],
    aggregateImpact: {} as ImpactAssessment,
    requiredConfirmations: [],
    auditRequired: true,
    ...overrides
  }),

  createMockImpactAssessment: (overrides: Partial<ImpactAssessment> = {}): ImpactAssessment => ({
    affectedWorkspaces: [],
    processCount: 0,
    estimatedDowntime: '< 1 second',
    dependentServices: [],
    rollbackPlan: 'No rollback required',
    riskFactors: [],
    ...overrides
  })
};

export default BulkOperationsTestUtils;