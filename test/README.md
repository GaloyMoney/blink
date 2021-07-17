# Test

## Prerequisites

If you want to run it locally, you will need the following things properly installed on your computer.

* [Direnv](https://direnv.net/)
* [Node.js](https://nodejs.org/)
* [Yarn](https://yarnpkg.com//)
* [Docker](https://www.docker.com/)
* [Docker Compose](https://docs.docker.com/compose/)
* [Runtime dependencies](#runtime-dependencies)

## Run tests

To run the test suite you can run:

```bash
$ make test
```
To execute the test suite [runtime dependencies](#runtime-dependencies) must be running.

### Run unit tests

```bash
$ yarn test:unit
# or
$ make unit
```

Runtime dependencies are not required

### Run integration tests

To execute the integration tests [runtime dependencies](#runtime-dependencies) must be running.

```bash
$ yarn test:integration
# or
$ make integration
```

The  integration tests are *not* fully idempotent (yet) so currently to re-run the tests, run:
```
$ make reset-integration
```

### Run specific test file

To execute a specific test file:

#### Unit

Example to run `test/unit/config.spec.ts`

```bash
$ TEST=config yarn test:unit
# or
$ TEST=config make unit
```
where `config` is the name of the file `config.spec.ts`

#### Integration

Example to run `test/integration/01-setup/01-connection.spec.ts`

```bash
$ TEST=01-connection yarn test:integration
# or
$ TEST=01-connection make integration
```

if within a specific test suite you want to run/debug only a describe or it(test) block please use:
* [describe.only](https://jestjs.io/docs/api#describeonlyname-fn): just for debug purposes
* [it.only](https://jestjs.io/docs/api#testonlyname-fn-timeout): just for debug purposes
* [it.skip](https://jestjs.io/docs/api#testskipname-fn): use it when a test is temporarily broken. Please don't commit commented test cases

## Runtime dependencies

```bash
$ make start-deps

# or
$ make reset-deps
```
Everytime the dependencies are re-started the environment must be reloaded via `direnv reload`. When using the [make command](../Makefile) this will happen automatically.

## Known issues

* **Test suite timeouts**: increase jest timeout value in [jest.setup.js](./jest.setup.js). Example:
  ```js
  jest.setTimeout(120000) // 120 seconds
  ```
* **LNDs don't (re)start**: delete `*.macaroon` files from [dev folder](../dev/lnd) and re-create [runtime dependencies](#runtime-dependencies):
  ```bash
  $ make reset-deps
  ```
* **Integration tests running slow**: we use docker to run dependencies (redis, mongodb, bitcoind and 4 lnds) so the entire test suite is disk-intensive.
  * Please make sure that you are running docker containers in a solid state drive (SSD)
  * Add the next setting to [lnd.conf](../dev/lnd/lnd.conf) and re-create runtime dependencies
    ```
    # ./dev/lnd/lnd.conf
    routing.strictgraphpruning=true
    ```
