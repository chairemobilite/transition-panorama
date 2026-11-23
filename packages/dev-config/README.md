# dev-config

Settings of the development tools, shared by the other packages.

## Usage

For Prettier, in a package's `package.json`:

```json
"prettier": "dev-config/prettier"
```

## Commands

Run from this folder, with `yarn <command>`.

| Command        | What it does                           |
| -------------- | -------------------------------------- |
| `check`        | Runs every check.                      |
| `check:format` | Checks the formatting.                 |
| `fix`          | Fixes what can be fixed automatically. |
| `fix:format`   | Fixes the formatting.                  |
