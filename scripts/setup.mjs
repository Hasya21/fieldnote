import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
const path = new URL('../backend/.env', import.meta.url);
if (existsSync(path)) {
  console.log('backend/.env already exists; preserved your configuration.');
} else {
  writeFileSync(
    path,
    'DEMO_EMAIL=analyst@fieldnote.local\nDEMO_PASSWORD=' +
      randomBytes(18).toString('base64url') +
      '\nJWT_SECRET=' +
      randomBytes(48).toString('hex') +
      '\nPORT=3001\nDEMO_ACCESS=true\n',
    { mode: 0o600 },
  );
  console.log(
    'Created backend/.env with random local credentials. Read that file for your sign-in details. Do not share it.',
  );
}
