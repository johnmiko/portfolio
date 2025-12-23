# Workspace Instructions Index

This workspace contains multiple projects. Each project has AI assistant instructions to ensure consistent conventions and stable APIs.

- Portfolio (Frontend, MUI + Vite)
  - Instructions: `.github/copilot-instructions.md`
  - Path: `portfolio/.github/copilot-instructions.md`
- Crib (Cribbage Backend, FastAPI)
  - Instructions: `.github/copilot-instructions.md`
  - Path: `crib/.github/copilot-instructions.md`
- Cribbage Connect (Cribbage Frontend, React + TS)
  - Instructions: `.github/copilot-instructions.md`
  - Path: `cribbage-connect/.github/copilot-instructions.md`
- Dota Game Finder (Backend, FastAPI)
  - Instructions: `.github/copilot-instructions.md`
  - Path: `dota/.github/copilot-instructions.md`

Usage:
- Before changing code in a project, read that project's instructions file.
- Keep API shapes and naming consistent with the instruction files (e.g., Crib maps internal `human` → frontend `you`).
- Update these instruction files when adding new endpoints, fields, or conventions.
