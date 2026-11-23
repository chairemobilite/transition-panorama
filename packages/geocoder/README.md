# geocoder

Finds places through geocoding services.

## Commands

Run from this folder, with `yarn <command>`.

| Command         | What it does                                      |
| --------------- | ------------------------------------------------- |
| `check`         | Runs every check and the tests, then type-checks. |
| `check:format`  | Checks the formatting.                            |
| `check:lint`    | Checks the linting.                               |
| `dev`           | Runs the comparison tool.                         |
| `fix`           | Fixes what can be fixed automatically.            |
| `fix:format`    | Fixes the formatting.                             |
| `fix:lint`      | Fixes the linting.                                |
| `test`          | Runs the tests.                                   |
| `test:coverage` | Runs the tests and reports the code they cover.   |

## Comparison tool

A page to compare what the geocoders find, in [./playground/](./playground/). It's for development only:
nothing builds it, and the package doesn't export it.

To run it:

1. Copy the example config:

    ```sh
    cp playground/config.example.yaml playground/config.yaml
    ```

2. List the geocoders to compare in `playground/config.yaml`.

3. Run the tool and open the address it shows:

    ```sh
    yarn dev
    ```
