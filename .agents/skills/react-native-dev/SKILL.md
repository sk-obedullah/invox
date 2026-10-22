---
name: react-native-dev
description: Workflows, guidelines, and commands for developing, testing, and debugging the Invox React Native mobile application.
---

# Invox React Native Development Runbook

## Commands & Scripts
Always use `npm.cmd` in PowerShell:
- **Run Unit Tests**: `npm.cmd test -- --watchAll=false`
- **Lint Code**: `npm.cmd run lint`
- **Start Metro Bundler**: Background task via `npm.cmd start`
- **Android Build**: `npm.cmd run android`

## Token & File Conventions
- Keep components modular in `src/`.
- Avoid scanning `android/` and `ios/` build output folders (`android/app/build`, `Pods/`).
- State management uses `zustand`. Form handling uses `react-hook-form` + `zod`.
