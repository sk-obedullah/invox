# Invox Project Rules

## Architecture & Code Standards
- **Framework**: React Native 0.85 with TypeScript.
- **State Management**: Zustand stores in `src/store/` or `src/context/`.
- **Validation**: Zod schemas for forms (`react-hook-form`).
- **UI Components**: React Native Paper and custom themed components.

## Context & Token Guardrails
- **Large Files Exclusion**: Never inspect `android/app/build`, `ios/Pods`, or `package-lock.json` directly.
- **CLI Commands**: Always execute `npm.cmd` instead of `npm` to adhere to Windows execution policies.
- **Edits**: Use targeted `edit_file` updates rather than full file overwrites.
