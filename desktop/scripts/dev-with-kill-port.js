#!/usr/bin/env node
// Script to kill port and start dev server

import { execSync } from 'child_process';

console.log('🔍 Killing port 1420...');
try {
    execSync('pnpm run kill-port', { stdio: 'inherit' });
} catch (error) {
    console.warn('⚠️ Could not kill port, continuing...');
}

console.log('🚀 Starting Vite dev server...');
execSync('pnpm dev', { stdio: 'inherit' });
