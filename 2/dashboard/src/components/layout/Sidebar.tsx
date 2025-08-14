import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Server, 
  FileText, 
  Settings, 
  Activity,
  BarChart3,
  X
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppSelector } from '../../store';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Servers', href: '/servers', icon: Server },
  { name: 'Logs', href: '/logs', icon: FileText },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const location = useLocation();
  const { selectedServer, servers } = useAppSelector((state) => state.servers);
  
  // Build navigation with conditional metrics link
  const navigation = React.useMemo(() => {
    const nav = [...baseNavigation];
    
    // Add metrics link if a server is selected or if we have servers
    if (selectedServer || servers.length > 0) {
      const metricsItem = {
        name: 'Metrics',
        href: selectedServer ? `/projects/${selectedServer}/metrics` : `/projects/default/metrics`,
        icon: BarChart3,
      };
      
      // Insert metrics after logs
      const logsIndex = nav.findIndex(item => item.href === '/logs');
      nav.splice(logsIndex + 1, 0, metricsItem);
    }
    
    return nav;
  }, [selectedServer, servers.length]);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:inset-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo section */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">MCP</span>
              </div>
              <span className="text-lg font-semibold text-foreground">Debug Host</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground group-hover:text-accent-foreground'
                    )}
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <div className="text-xs text-muted-foreground">
              <p>MCP Debug Host Platform</p>
              <p className="mt-1">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;