# Dev environment

## Setup

This setup was last tested with the following tools:
```
$ node --version
v14.17.0
$ yarn --version
1.22.10
$ direnv --version
2.28.0
$ docker --version
Docker version 20.10.7, build f0df350
$ docker-compose --version
docker-compose version 1.29.2, build unknown
```

We use [direnv](https://direnv.net) to load environment variables needed for running the integration tests.
Don't forget to add the [direnv hook](https://direnv.net/docs/hook.html) to your `shell.rc` file.

Clone the repo and install dependencies:
```
$ git clone git@github.com:GaloyMoney/galoy.git
$ cd galoy
$ direnv allow
direnv reload
direnv: direnv: loading ~/projects/GaloyMoney/galoy/.envrc
(...)
$ yarn install
```

## Development

To start the GraphQL server and its dependencies:
```
$ make start
```


Alernatively, to start the GraphQL server in watch mode (with automatic restart on changes):
```
$ make watch
```

## Testing

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
$ TEST=utils yarn test:unit
# or
$ TEST=utils make unit
```
where `utils` is the name of the file `utils.spec.ts`

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

### Runtime dependencies

```bash
$ make start-deps

# or
$ make reset-deps
```
Everytime the dependencies are re-started the environment must be reloaded via `direnv reload`. When using the [make command](../Makefile) this will happen automatically.

### Known issues

* **Test suite timeouts**: increase jest timeout value. Example:
  ```bash
  # 120 seconds
  $ JEST_TIMEOUT=120000 yarn test:integration
  ```
* **Integration tests running slow**: we use docker to run dependencies (redis, mongodb, bitcoind and 4 lnds) so the entire test suite is disk-intensive.
  * Please make sure that you are running docker containers in a solid state drive (SSD)
  * Reduce lnd log disk usage: change debuglevel to critical
    ```
    # ./dev/lnd/lnd.conf
    debuglevel=critical
    ```

## Running checks

It's recommended that you use plugins in your editor to run ESLint checks and perform Prettier formatting on-save.

To run all the checks required for the code to pass GitHub actions check:

```
$ make check-code
(...)
$ echo $?
0
```

If you need to run Prettier through the command line, you can use:

```
$ yarn prettier -w .
```

## Contributing

When opening a PR please pay attention to having a [clean git history](https://medium.com/@catalinaturlea/clean-git-history-a-step-by-step-guide-eefc0ad8696d) with good [commit messages](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html).
It is the responsibility of the PR author to resolve merge conflicts before a merge can happen. If the PR is open for a long time a rebase may be requested.
