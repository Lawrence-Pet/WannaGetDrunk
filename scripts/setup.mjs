import { existsSync, copyFileSync, mkdirSync, closeSync, openSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
mkdirSync('data', { recursive: true });
if (!existsSync('.env')) copyFileSync('.env.example', '.env');
if (!existsSync('data/wannagetdrunk.db')) closeSync(openSync('data/wannagetdrunk.db', 'w'));
execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'db', 'push'], { stdio: 'inherit' });
