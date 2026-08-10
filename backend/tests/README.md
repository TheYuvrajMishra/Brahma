# Brahma Testing & Debug Scripts

This directory contains standalone testing, dry-run, and scratch scripts for various pipeline stages, skill integrations, and end-to-end flows.

## Test Scripts Overview

| File | Description | Execution Command |
| :--- | :--- | :--- |
| `test-e2e-flow.ts` | Socket-driven end-to-end test connecting to local server | `npm run test:e2e` |
| `test-composer.ts` | Dry-run test for the response Composer stage | `npm run test:composer` |
| `test-converter-dryrun.ts` | Test document-to-markdown conversion utility | `npm run test:converter` |
| `test-email.ts` | Test SendEmail skill integration | `npm run test:email` |
| `test-get-emails.ts` | Test GetEmails skill integration | `npm run test:get-emails` |
| `test-sheets.ts` | End-to-end CRUD test for Google Sheets skills | `npm run test:sheets` |
| `test-compression.ts` | Test ReflectionEngine memory compression cycle | `npm run test:compression` |
| `scratch-planner.ts` | Test and debug the Planner pipeline phase | `npx ts-node tests/scratch-planner.ts` |
| `scratch-get-sessions.ts` | Query MongoDB for active chat sessions & context | `npx ts-node tests/scratch-get-sessions.ts` |
| `read-sheet-scratch.ts` | Utility script to inspect spreadsheet content | `npx ts-node tests/read-sheet-scratch.ts` |
| `update-sheet-scratch.ts` | Test routine re-scheduling & updating via LLM | `npx ts-node tests/update-sheet-scratch.ts` |

## Running Tests

From the `backend` directory, execute npm test commands or `npx ts-node`:

```bash
# Run end-to-end test flow
npm run test:e2e

# Run Google Sheets integration test
npm run test:sheets
```
