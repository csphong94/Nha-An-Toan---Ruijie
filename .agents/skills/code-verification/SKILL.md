---
name: code-verification
description: Verify codebase changes using linting, building, and executing local integration tests.
---

# Code Verification Skill

This skill provides a systematic way to verify that changes made to the codebase do not break build processes or API endpoints, and that all style rules are met.

## When to use
Use this skill whenever you make major changes to backend endpoints (`server/index.js`, etc.) or frontend views (`src/App.jsx`, `src/Admin.jsx`).

## Step-by-step Instructions

1. **Verify Linting**:
   Run the project's linter or `oxlint` to check for syntax and reference errors:
   ```bash
   npx oxlint --deny=correctness --deny=suspicious
   ```

2. **Verify React Build**:
   Build the frontend project using Vite to ensure bundler configurations are correct:
   ```bash
   npm run build
   ```

3. **Verify API Endpoints**:
   Execute test scripts using Node to verify that external services (MoMo, Ruijie API) mock successfully:
   ```bash
   node test_momo.mjs
   node test_voucher.mjs
   ```

4. **Verify Database Integrity**:
   Inspect `server/data/database.json` (or whichever file stores data) to ensure schema additions did not break existing JSON syntax.
