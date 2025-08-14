import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  setConfigChange, 
  validateConfigChange, 
  clearConfigChange 
} from '../../store/slices/projectControlsSlice';
import { Save, X, Plus, Trash2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface ConfigurationManagerProps {
  projectId: string;
}

const ConfigurationManager: React.FC<ConfigurationManagerProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const configChange = useAppSelector(state => state.projectControls.configChanges[projectId]);
  const servers = useAppSelector(state => state.servers.servers);
  const currentProject = servers.find(s => s.id === projectId);

  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [volumes, setVolumes] = useState<string[]>([]);
  const [ports, setPorts] = useState<Record<string, number>>({});
  const [network, setNetwork] = useState<string>('bridge');
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  const [newVolume, setNewVolume] = useState('');
  const [newPortKey, setNewPortKey] = useState('');
  const [newPortValue, setNewPortValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [configHistory, setConfigHistory] = useState<any[]>([]);

  useEffect(() => {
    if (currentProject?.config) {
      setEnvVars(currentProject.config.environment || {});
      setVolumes(currentProject.config.volumes || []);
      setPorts(currentProject.config.ports || {});
      setNetwork(currentProject.config.network || 'bridge');
    }
  }, [currentProject]);

  useEffect(() => {
    const changes = {
      projectId,
      changes: {
        environment: envVars,
        volumes,
        ports,
        network
      },
      validated: false
    };
    
    dispatch(setConfigChange(changes));
    validateConfiguration();
  }, [envVars, volumes, ports, network]);

  const validateConfiguration = () => {
    const errors: string[] = [];

    Object.entries(envVars).forEach(([key, value]) => {
      if (!key.match(/^[A-Z_][A-Z0-9_]*$/)) {
        errors.push(`Invalid environment variable name: ${key}`);
      }
    });

    volumes.forEach(volume => {
      if (!volume.match(/^[a-zA-Z0-9_\-\/\.:]+$/)) {
        errors.push(`Invalid volume path: ${volume}`);
      }
    });

    Object.entries(ports).forEach(([key, value]) => {
      if (value < 1 || value > 65535) {
        errors.push(`Invalid port number ${value} for ${key}`);
      }
    });

    const portValues = Object.values(ports);
    const duplicates = portValues.filter((port, index) => portValues.indexOf(port) !== index);
    if (duplicates.length > 0) {
      errors.push(`Port conflict detected - duplicate port mappings: ${duplicates.join(', ')}`);
    }

    dispatch(validateConfigChange({
      projectId,
      validated: errors.length === 0,
      errors
    }));
  };

  const addEnvVar = () => {
    if (newEnvKey && newEnvValue) {
      setEnvVars({ ...envVars, [newEnvKey]: newEnvValue });
      setNewEnvKey('');
      setNewEnvValue('');
    }
  };

  const removeEnvVar = (key: string) => {
    const updated = { ...envVars };
    delete updated[key];
    setEnvVars(updated);
  };

  const addVolume = () => {
    if (newVolume && !volumes.includes(newVolume)) {
      setVolumes([...volumes, newVolume]);
      setNewVolume('');
    }
  };

  const removeVolume = (index: number) => {
    setVolumes(volumes.filter((_, i) => i !== index));
  };

  const addPort = () => {
    if (newPortKey && newPortValue) {
      const portNum = parseInt(newPortValue);
      if (!isNaN(portNum)) {
        setPorts({ ...ports, [newPortKey]: portNum });
        setNewPortKey('');
        setNewPortValue('');
      }
    }
  };

  const removePort = (key: string) => {
    const updated = { ...ports };
    delete updated[key];
    setPorts(updated);
  };

  const handleSave = async () => {
    if (!configChange?.validated) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configChange.changes)
      });

      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }

      const newConfig = {
        timestamp: Date.now(),
        config: configChange.changes
      };
      setConfigHistory([...configHistory, newConfig]);

      dispatch(clearConfigChange(projectId));
    } catch (error) {
      console.error('Save configuration error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = (config: any) => {
    // Rollback to previous configuration
    setEnvVars(config.environment || {});
    setVolumes(config.volumes || []);
    setPorts(config.ports || {});
    setNetwork(config.network || 'bridge');
    
    // Re-run validation after rollback
    validateConfiguration();
  };

  const suggestAvailablePort = async () => {
    try {
      const response = await fetch('/api/ports/suggest');
      const data = await response.json();
      setNewPortValue(data.port.toString());
    } catch (error) {
      console.error('Failed to get suggested port:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Configuration Manager
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={!configChange?.validated || saving}
            className={`
              flex items-center px-4 py-2 rounded-md text-white transition-colors
              ${configChange?.validated && !saving
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gray-400 cursor-not-allowed'
              }
            `}
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Apply Changes'}
          </button>
        </div>
      </div>

      {configChange?.errors && configChange.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Configuration Validation Errors
              </p>
              <ul className="mt-2 text-xs text-red-600 dark:text-red-300 list-disc list-inside">
                {configChange.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Environment Variables
          </h4>
          <div className="space-y-2">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={key}
                  disabled
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setEnvVars({ ...envVars, [key]: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                />
                <button
                  onClick={() => removeEnvVar(key)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="KEY"
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
              />
              <input
                type="text"
                placeholder="Value"
                value={newEnvValue}
                onChange={(e) => setNewEnvValue(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
              />
              <button
                onClick={addEnvVar}
                className="p-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Volume Mounts
          </h4>
          <div className="space-y-2">
            {volumes.map((volume, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={volume}
                  onChange={(e) => {
                    const updated = [...volumes];
                    updated[index] = e.target.value;
                    setVolumes(updated);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                />
                <button
                  onClick={() => removeVolume(index)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="/host/path:/container/path"
                value={newVolume}
                onChange={(e) => setNewVolume(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
              />
              <button
                onClick={addVolume}
                className="p-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Port Mappings
          </h4>
          <div className="space-y-2">
            {Object.entries(ports).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={key}
                  disabled
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"
                />
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setPorts({ ...ports, [key]: parseInt(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                />
                <button
                  onClick={() => removePort(key)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Service name"
                value={newPortKey}
                onChange={(e) => setNewPortKey(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
              />
              <input
                type="number"
                placeholder="Port"
                value={newPortValue}
                onChange={(e) => setNewPortValue(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
              />
              <button
                onClick={suggestAvailablePort}
                className="p-2 bg-gray-500 text-white hover:bg-gray-600 rounded-md"
                title="Suggest available port"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={addPort}
                className="p-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Network Mode
          </h4>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
          >
            <option value="bridge">Bridge</option>
            <option value="host">Host</option>
            <option value="none">None</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {configHistory.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Configuration History
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {configHistory.map((config, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {new Date(config.timestamp).toLocaleString()}
                </span>
                <button
                  onClick={() => handleRollback(config.config)}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Rollback
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationManager;