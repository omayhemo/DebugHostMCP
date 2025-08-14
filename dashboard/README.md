# Plop-a-Dock Dashboard

A modern React dashboard for managing Plop-a-Dock containerized development environments. Just plop it down and dock it! 🚢 Built with React 18, Vite, TypeScript, and Tailwind CSS.

## Features

- **Modern Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **State Management**: Redux Toolkit with dev tools
- **Routing**: React Router with protected routes
- **Responsive Design**: Mobile-first approach with dark/light theme support
- **API Integration**: Axios-based service layer with error handling
- **Real-time Updates**: WebSocket/SSE support for live server status and metrics
- **Container Metrics**: Real-time visualization of CPU, memory, disk, and network metrics
- **Performance Monitoring**: Built-in performance tracking and optimization
- **Log Viewer**: Real-time log streaming with advanced filtering
- **Performance Optimized**: Bundle splitting, lazy loading, and optimized builds

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── common/         # Common utilities (ErrorBoundary, LoadingSpinner, etc.)
│   ├── layout/         # Layout components (Header, Sidebar, Layout)
│   ├── logs/           # Real-time log viewer components
│   └── metrics/        # Container metrics visualization components
├── hooks/              # Custom React hooks
│   ├── useMetricsStream.ts  # WebSocket/SSE metrics streaming
│   └── __tests__/      # Hook tests
├── pages/              # Page components
├── services/           # API service layer
│   ├── api.ts          # Base API client
│   ├── logService.ts   # Log streaming service
│   └── metricsService.ts # Metrics streaming service
├── store/              # Redux store and slices
│   └── slices/         # Redux slices
│       ├── authSlice.ts
│       ├── logsSlice.ts
│       ├── metricsSlice.ts
│       ├── serversSlice.ts
│       └── uiSlice.ts
├── utils/              # Utility functions
├── App.tsx            # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles and Tailwind imports
```

## API Integration

The dashboard connects to the Plop-a-Dock backend API. Configure the API endpoint in `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Available Services

- **AuthService**: User authentication and session management
- **ServerService**: Server lifecycle management and monitoring
- **LogService**: Real-time log streaming with SSE/WebSocket support
- **MetricsService**: Container metrics streaming and data export
- **API Service**: Base HTTP client with interceptors and error handling

## State Management

Redux Toolkit is used for global state management with the following slices:

- **authSlice**: User authentication state
- **uiSlice**: UI preferences (theme, sidebar, notifications)
- **serversSlice**: Server management state
- **logsSlice**: Real-time log viewing and filtering state
- **metricsSlice**: Container metrics visualization and streaming state

## Styling

The project uses Tailwind CSS with a custom design system:

- **Responsive Design**: Mobile-first approach
- **Dark/Light Themes**: Automatic system preference detection
- **CSS Variables**: Theme-aware color system
- **Component Styling**: Utility-first approach with custom components

## Scripts

```bash
# Development
npm run dev              # Start development server with HMR
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking
```

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Optimizations

- **Bundle Splitting**: Vendor, router, and Redux chunks
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and font optimization
- **Lazy Loading**: Component-based code splitting
- **Compression**: Gzip compression for production builds

## Route Structure

### Application Routes
- `/login` - User authentication
- `/dashboard` - Main dashboard overview
- `/servers` - Server management interface
- `/logs` - Real-time log viewer
- `/projects/:id/metrics` - Container metrics for specific project
- `/monitoring` - System monitoring (future)
- `/settings` - User preferences

### Protected Routes
All routes except `/login` require authentication. The `ProtectedRoute` component handles:
- Authentication verification
- Automatic redirects to login
- Token refresh handling

## Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with React and TypeScript rules
- **Prettier**: Consistent code formatting
- **Naming**: PascalCase for components, camelCase for functions

### Component Guidelines

- Use functional components with hooks
- Implement proper TypeScript interfaces
- Follow responsive design principles
- Include accessibility attributes
- Use error boundaries for robust error handling

### State Management

- Use Redux Toolkit for global state
- Keep component-specific state local
- Implement proper loading and error states
- Use typed hooks (useAppDispatch, useAppSelector)

## Feature Implementation Status

### ✅ Story 3.1: Dashboard Scaffolding (Complete)
- React 18 + TypeScript + Vite foundation
- Redux Toolkit state management
- Tailwind CSS responsive design
- Protected routing and authentication

### ✅ Story 3.2: Real-time Log Viewer (Complete)
- Real-time log streaming via SSE/WebSocket
- Advanced filtering and search capabilities
- Virtual scrolling for performance (10,000+ logs)
- Export functionality (JSON, CSV, text)
- Comprehensive error handling

### ✅ Story 3.3: Container Metrics Visualization (Complete)
- Real-time metrics streaming for CPU, memory, disk, network
- Interactive Chart.js visualizations with time range selection
- WebSocket/SSE connection management with auto-reconnection
- Performance monitoring and metrics export
- Comprehensive testing suite

## Container Metrics Features

### Real-time Visualization
- **CPU Usage**: Line charts with percentage utilization
- **Memory Usage**: Area charts with usage vs. limits
- **Disk Usage**: Bar charts with available space tracking
- **Network I/O**: Dual-line charts for ingress/egress traffic

### Interactive Controls
- **Time Range Selection**: 1m, 5m, 15m, 1h, 6h, 24h intervals
- **View Modes**: Grid and list layouts for optimal viewing
- **Auto-refresh**: Configurable refresh intervals (5s to 5m)
- **Container Selection**: Multi-select containers for comparison

### Advanced Features
- **Connection Status**: Real-time connection monitoring with retry logic
- **Performance Monitor**: Latency, render time, and memory usage tracking
- **Alert Thresholds**: Configurable CPU, memory, and disk alerts
- **Export Options**: JSON, CSV, and Prometheus format exports

### Technical Implementation
- **Dual Transport**: Server-Sent Events with WebSocket fallback
- **Reconnection Strategy**: Exponential backoff with jitter
- **Performance Optimized**: Virtual rendering, memoization, and efficient updates
- **TypeScript**: Fully typed interfaces and comprehensive error handling

## Testing Coverage

### Unit Tests
- **MetricsVisualization**: Chart rendering, data processing, responsive behavior
- **useMetricsStream**: Connection management, reconnection logic, error handling
- **Redux Slices**: State management, action creators, and reducers

### Integration Tests
- **End-to-End Flows**: Complete user journeys from connection to visualization
- **API Integration**: Service layer integration with mock backends
- **WebSocket Simulation**: Connection lifecycle and data streaming scenarios

### Performance Tests
- **Large Datasets**: 10,000+ data points handling
- **Memory Management**: Long-running session stability
- **Rendering Performance**: 60fps maintenance under load

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000/api  # Backend API endpoint
NODE_ENV=development                         # Environment mode
VITE_ENABLE_DEV_TOOLS=true                  # Redux DevTools
VITE_ENABLE_ANALYTICS=false                 # Analytics integration
VITE_BUILD_ANALYZE=false                    # Bundle analysis
```

## Troubleshooting

### Common Issues

1. **Port 5173 already in use**: Change port in `vite.config.ts`
2. **API connection errors**: Verify backend server is running
3. **Build failures**: Clear `node_modules` and reinstall dependencies
4. **TypeScript errors**: Run `npm run type-check` for detailed errors

### Development Tips

- Use Redux DevTools for state debugging
- Enable React Developer Tools browser extension
- Monitor network requests in browser DevTools
- Check console for error messages and warnings

## Contributing

1. Follow the established code style and patterns
2. Ensure TypeScript compilation without errors
3. Test responsive design on multiple screen sizes
4. Verify dark/light theme compatibility
5. Update documentation for new features

## License

This project is part of the Plop-a-Dock Platform - see the main project LICENSE file for details.