#!/usr/bin/env node
// Emits KEY=VALUE lines to stdout for every env key declared in src/env.ts
// whose value is present in process.env. Non-empty values only.
//
// The deploy workflow rehydrates all GitHub Secrets (via `toJSON(secrets)`)
// into process.env before calling this, so any new schema key with a
// same-named secret flows through automatically — no workflow edit required.
//
// Static prod values (NODE_ENV, PORT, DB_HOST, hardcoded expiries, etc.)
// are prepended by the workflow separately — this script only handles
// the secret-backed keys.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(here, '..', 'src', 'env.ts');
const source = readFileSync(schemaPath, 'utf8');

// Match `KEY: z...` at the start of a schema field line. Accepts both
// single-line (`KEY: z.string()`) and multi-line (`KEY: z\n    .string()`)
// zod definitions. Keep the two grep patterns aligned with the workflow's
// drift check.
const KEY_RE = /^\s+([A-Z][A-Z0-9_]*)\s*:\s*z\b/gm;
const keys = new Set();
for (const match of source.matchAll(KEY_RE)) {
  keys.add(match[1]);
}

if (keys.size === 0) {
  console.error('render-env: found zero keys in src/env.ts — refusing to emit empty file');
  process.exit(1);
}

const emitted = [];
const missing = [];
for (const key of [...keys].sort()) {
  const value = process.env[key];
  if (value === undefined || value === '') {
    missing.push(key);
    continue;
  }
  // Single-quote every value so docker compose --env-file treats it as literal.
  // Double quotes would unescape sequences like \n, breaking values that must
  // reach the app with literal backslashes (FIREBASE_PRIVATE_KEY, GCP_PRIVATE_KEY —
  // both do `.replace(/\\n/g, '\n')` at runtime).
  // If the value contains a real newline, drop it — compose --env-file cannot
  // parse multi-line values in either quoting style; keys must be one-line.
  if (value.includes('\n')) {
    console.error(`render-env: value for ${key} contains a real newline — collapse to \\n before adding to secrets`);
    process.exit(1);
  }
  if (value.includes("'")) {
    console.error(`render-env: value for ${key} contains a single quote — not supported`);
    process.exit(1);
  }
  emitted.push(`${key}='${value}'`);
}

process.stdout.write(emitted.join('\n') + '\n');

// Report missing keys to stderr so the workflow can surface them without
// failing this step (the workflow's own validate step decides what's required).
if (missing.length > 0) {
  console.error(`render-env: no value for ${missing.length} schema key(s): ${missing.join(', ')}`);
}
