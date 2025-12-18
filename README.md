# Portfolio Website

A React-based portfolio website showcasing personal projects with tabs for Resume, Dota, Alarm, and future additions.

## Features

- **Resume Tab**: Interactive resume with font customization and collapsible sections
- **Project Tabs**: Dedicated sections for Dota and Alarm projects (backend integration pending)
- **Responsive Design**: Mobile-friendly layout using Material-UI
- **Shared Footer**: Contact information across all pages

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Material-UI for components
- React Router for client-side routing

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

## Deployment

Configured for Vercel deployment with auto-deploy from GitHub main branch.

## Backend Integration

Backends will be built with FastAPI and deployed separately. Frontend uses environment variables for API URLs.
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
