import { randomBytes } from 'node:crypto';

const password = randomBytes(18).toString('base64url');
process.stdout.write(`${password}\n`);
