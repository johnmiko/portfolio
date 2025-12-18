# AI Coding Assistant Instructions for Portfolio Project

## Project Overview
This is a React-based portfolio website with Material-UI, featuring tabs for personal projects (Resume, Dota, Alarm) and shared footer with contact info. Backends use FastAPI, deployed separately.

## Architecture
- **Frontend**: React SPA with TypeScript, Vite build tool, client-side routing via React Router
- **UI**: Material-UI components with custom theme, responsive design (mobile/tablet/desktop)
- **Tabs**: Top navigation using MUI Tabs integrated with React Router
- **Resume Tab**: Interactive sections with font selector (Roboto/Arial/Times/Courier), collapsible job experiences via MUI Accordion, skills as Chip components
- **Project Tabs**: Placeholder components for Dota/Alarm, to be integrated with FastAPI backends
- **Footer**: Shared across all routes with contact details

## Key Patterns
- **Layout Structure**: `Layout.tsx` wraps routes with AppBar (tabs) and footer
- **Component Organization**: Each tab is a separate component in `src/components/`
- **Styling**: MUI sx prop for inline styles, theme provider for consistency
- **Routing**: BrowserRouter with Routes/Route, tabs use Link components
- **State Management**: Local useState for font selection in Resume
- **Accessibility**: Semantic HTML, proper labels, keyboard navigation via MUI defaults

## Development Workflow
- **Local Dev**: `npm run dev` starts Vite server (default port 5173)
- **Backends**: FastAPI servers on separate ports (e.g., 8000, 8001), use environment variables for API URLs
- **Build**: `npm run build` for production bundle
- **Deployment**: Vercel for frontend (auto-deploy main branch), backends on Render/Fly/Railway

## Conventions
- **File Structure**: `src/components/` for UI components, `src/` for main app files
- **Imports**: Group MUI imports, use type-only imports for TypeScript types
- **Naming**: PascalCase for components, camelCase for variables
- **Error Handling**: Basic try/catch for API calls (when implemented)
- **Performance**: Lazy loading for future heavy components, avoid unnecessary re-renders

## Integration Points
- **Resume**: Static content with interactivity; replace sample data with actual resume details
- **Dota/Alarm**: Fetch from FastAPI endpoints (e.g., `/api/dota/data`), handle loading/error states
- **Environment**: Use `.env` files for API_BASE_URL switching between local/prod

## Common Tasks
- Adding new tab: Create component in `src/components/`, add route in `App.tsx`, update tabs in `Layout.tsx`
- Styling: Use MUI theme overrides or sx props; ensure responsive with breakpoints
- API Integration: Use fetch/axios in useEffect, store in state, display in components
- Testing: Add unit tests with Vitest (future), e2e with Playwright (future)

Reference: [Layout.tsx](src/components/Layout.tsx) for navigation, [Resume.tsx](src/components/Resume.tsx) for interactive features, [App.tsx](src/App.tsx) for routing setup.