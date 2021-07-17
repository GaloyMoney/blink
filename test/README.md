# Test

## Prerequisites

If you want to run it locally, you will need the following things properly installed on your computer.

* [Direnv](https://direnv.net/)
* [Node.js](https://nodejs.org/)
* [Yarn](https://yarnpkg.com//)
* [Docker](https://www.docker.com/)
* [Docker Compose](https://docs.docker.com/compose/)
* [Runtime dependencies](https://docs.docker.com/compose/)

## Run tests

To execute the test suite runtime dependencies must be running.

```bash
$ make start-deps

# or
$ make reset-deps
```
Everytime the dependencies are re-started the environment must be reloaded via `direnv reload`. When using the [make command](../Makefile) this will happen automatically.

To run the test suite you can run:

```bash
$ make test
```

### Run unit tests

```bash
$ yarn test:unit
# or
$ make unit
```

Runtime dependencies are not required

### Run integration tests

To execute the integration tests runtime dependencies must be running.

```bash
$ yarn test:integration
# or
$ make integration
```

The  integration tests are *not* fully idempotent (yet) so currently to re-run the tests, run:
```
$ make reset-integration
```

## Known issues

* **Test suite timeouts**: increase jest timeout value in [jest.setup.js](./jest.setup.js). Example:
  ```js
  jest.setTimeout(120000) // 120 seconds
  ```
* **LNDs don't (re)start**: delete `*.macaroon` files from [dev folder](../dev/lnd) and re-create runtime dependencies:
  ```bash
  $ make reset-deps
  ```
* **Integration tests running slow**: we use docker to run dependencies (redis, mongodb, bitcoind and 4 lnd) so the entire test suite is disk-intensive.
  * Please make sure that you are running docker containers in a solid state drive (SSD)
  * Add the next setting to [lnd.conf](../dev/lnd/lnd.conf) and and re-create runtime dependencies
    ```
    # ./dev/lnd/lnd.conf
    routing.strictgraphpruning=true
    ```
