import { rmSync } from 'node:fs';
// Only remove the generated production output, relative to this project script.
rmSync(new URL('../dist/', import.meta.url), { recursive: true, force: true });
