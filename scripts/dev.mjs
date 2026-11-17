import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const python = root + 'agent/.venv/bin/python';
for (const path of [python, root + 'server/node_modules', root + 'client/node_modules', root + 'server/.env', root + 'agent/.env', root + 'client/.env.local']) {
  if (!existsSync(path)) {
    console.error(`Missing ${path}. Follow README.md setup first.`);
    process.exit(1);
  }
}
const children = [];
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
  }
  process.exitCode = code;
}
for (const [command, args, cwd] of [
  [process.execPath, ['server.js'], 'server'],
  [python, ['server.py'], 'agent'],
  ['npm', ['run', 'dev'], 'client'],
]) {
  const child = spawn(command, args, { cwd: root + cwd, stdio: 'inherit', detached: true });
  children.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code || 1); });
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
