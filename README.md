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

## Structure

The project is split into workspaces, each with its own README, dependencies and commands.

- `apps/` holds what runs and is deployed.
- `packages/` holds what the apps import. A package never depends on an app.

| Workspace                                                    | What it is                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| [`apps/frontend`](./apps/frontend)                           | The web app people use to compare the scenarios.                          |
| [`apps/backend`](./apps/backend)                             | The server between the frontend and Transition.                           |
| [`packages/contract`](./packages/contract)                   | What the frontend and the backend agree on: their API, the public config. |
| [`packages/geocoder`](./packages/geocoder)                   | Finds places through geocoding services.                                  |
| [`packages/transition-client`](./packages/transition-client) | A client for Transition's API.                                            |
| [`packages/utils`](./packages/utils)                         | Generic code shared by the other workspaces.                              |
| [`packages/dev-config`](./packages/dev-config)               | Settings of the development tools, shared by the other workspaces.        |

## Development tools

- [Geocoder comparison](./packages/geocoder/README.md#comparison-tool): compares what the geocoders find.
