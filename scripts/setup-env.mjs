import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
for (const [example, target] of [
  ['server/.env.example', 'server/.env'],
  ['agent/.env.example', 'agent/.env'],
  ['client/.env.example', 'client/.env.local'],
]) {
  if (existsSync(root + target)) continue;
  let contents = readFileSync(root + example, 'utf8');
  for (const key of ['JWT_SECRET', 'ENCRYPTION_KEY']) {
    contents = contents.replace(`${key}=\n`, `${key}=${randomBytes(32).toString('hex')}\n`);
  }
  writeFileSync(root + target, contents, { mode: 0o600 });
  console.log(`Created ${target}`);
}
