# Transition Panorama

An open-source public consultation platform for comparing transportation scenarios at a glance.

## Quick start

Requirements:

- [Node.js](https://nodejs.org) 24
- [Yarn](https://yarnpkg.com)
- A running [Transition](https://github.com/chairemobilite/transition) server with the scenarios intended for
  comparison

Steps:

1. Copy the example settings:

   ```sh
   cp .env.example .env
   cp config.public.example.yaml config.public.yaml
   ```

2. Set Transition's address and credentials in `.env`.

3. Make the scenarios in `config.public.yaml` match Transition's.

4. Install the dependencies and run the app:

   ```sh
   yarn
   yarn dev
   ```

5. Open http://localhost:5173.

## Commands

Run from the repository's root, with `yarn <command>`.

| Command         | What it does                                    |
| --------------- | ----------------------------------------------- |
| `build`         | Builds the project.                             |
| `check`         | Runs every check, the tests and the build.      |
| `codegen`       | Regenerates the generated code.                 |
| `dev`           | Runs the project for development.               |
| `fix`           | Fixes what can be fixed automatically.          |
| `start`         | Runs the built project.                         |
| `test`          | Runs the tests.                                 |
| `test:coverage` | Runs the tests and reports the code they cover. |

## Development tools

- [Geocoder comparison](./packages/geocoder/README.md#comparison-tool): compares what the geocoders find.
