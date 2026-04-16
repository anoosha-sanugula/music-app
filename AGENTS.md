# Expo Project Agent Notes

## Commands
- Start dev server: `npx expo start` (not `npm start`)
- Lint: `npx expo lint` (uses expo's eslint integration)
- Reset project: `npm run reset-project` (moves app/ to app-example/, creates blank app/)

## Key Conventions
- **Entry point**: `"main": "expo-router/entry"` in package.json
- **File-based routing**: All routes live in `app/` directory
- **Root layout**: `app/_layout.tsx` must include `import 'react-native-reanimated'`
- **Path alias**: Use `@/*` for imports from project root  
  (e.g., `import { useColorScheme } from '@/hooks/use-color-scheme'`)

## Config Notes
- `app.json` experiments: `typedRoutes` and `reactCompiler` are enabled
- Strict TypeScript enabled (`tsconfig.json`)
- New Architecture enabled for iOS/Android

---

## Spec File Rules (SDD)

- All specs MUST be created under `/specs` directory
- Each phase must have its own folder:
  - `specs/phase-1/`
  - `specs/phase-2/`
  - `specs/phase-3/`
  - `specs/phase-4/`
- Spec file must be named exactly: `spec.md`
- Plan and tasks files must follow:
  - `plan.md`
  - `tasks.md`
- No spec files are allowed in the root directory
- Do NOT create files like `SPEC.md` or `spec.txt` anywhere else
- Always create missing folders before writing spec files

## Agent Behavior Rules

- NEVER decide spec file location automatically — always follow `/specs/phase-x/`
- When generating specs, ALWAYS:
  1. Create correct folder structure
  2. Write to `spec.md`
- DO NOT implement code when asked to create a spec
- Follow SDD pipeline strictly:
  - Spec → Clarify → Plan → Tasks → Implement