#!/usr/bin/env node
// [kill-port.js] - Script to kill processes using a specific port on Windows
// This ensures the dev server can start cleanly without port conflicts

import { execSync } from 'child_process';

const PORT = process.argv[2] || 1420;

console.log(`🔍 Checking for processes using port ${PORT}...`);

try {
    // Get the PID of the process using the port
    const result = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf-8' });
    const lines = result.trim().split('\n');

    const pids = new Set();

    for (const line of lines) {
        // Parse the netstat output to get PID
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];

        // Only kill LISTENING processes (not TIME_WAIT, etc.)
        if (line.includes('LISTENING') && pid && pid !== '0') {
            pids.add(pid);
        }
    }

    if (pids.size === 0) {
        console.log(`✅ Port ${PORT} is free`);
        process.exit(0);
    }

    for (const pid of pids) {
        console.log(`🔪 Killing process ${pid}...`);
        try {
            execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf-8' });
            console.log(`✅ Killed process ${pid}`);
        } catch (killError) {
            console.warn(`⚠️ Could not kill process ${pid}: ${killError.message}`);
        }
    }

    // Wait a bit for the port to be released (synchronous)
    console.log('⏳ Waiting for port to be released...');
    execSync('ping 127.0.0.1 -n 2 > nul', { shell: true });

    console.log(`✅ Port ${PORT} should now be free`);
} catch (error) {
    // No processes using the port
    console.log(`✅ Port ${PORT} is free`);
}
