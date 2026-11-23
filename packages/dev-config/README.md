# dev-config

Settings of the development tools, shared by the other packages.

## Usage

For ESLint, in a package's `eslint.config.ts`, before the package's own rules:

```ts
import { createBaseConfig } from 'dev-config/eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    createBaseConfig(new URL('.', import.meta.url).pathname),
]);
```

For Prettier, in a package's `package.json`:

```json
"prettier": "dev-config/prettier"
```

## Commands

Run from this folder, with `yarn <command>`.

| Command        | What it does                           |
| -------------- | -------------------------------------- |
| `check`        | Runs every check, then type-checks.    |
| `check:format` | Checks the formatting.                 |
| `check:lint`   | Checks the linting.                    |
| `fix`          | Fixes what can be fixed automatically. |
| `fix:format`   | Fixes the formatting.                  |
| `fix:lint`     | Fixes the linting.                     |
