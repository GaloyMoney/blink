# Dev environment

## Setup

This setup was last tested with the following tools:
```
$ node --version
v18.12.0
$ yarn --version
1.22.17
$ direnv --version
2.28.0
$ jq --version
jq-1.6
$ docker --version
Docker version 20.10.8, build f0df350
$ docker compose version
Docker Compose version 2.0.0
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

### Runtime dependencies

```bash
$ make start-deps

# or
$ make reset-deps
```
Everytime the dependencies are re-started the environment must be reloaded via `direnv reload`. When using the [make command](../Makefile) this will happen automatically.

## Development

To start the GraphQL server and its dependencies:
```
$ make start
```

After running `make start-deps` or `make reset-deps`, the lightning network - running on regtest - will not have any channel, and the mongodb database - that includes some mandatory accounts for Galoy to work - will be empty. 

To seed the channels and accounts, run: `TEST="01|02" make reset-integration`

Alernatively, to start the GraphQL server in watch mode (with automatic restart on changes):
```
$ make watch
```

### Using GraphiQL

You can load GraphiQL, a web GUI for GraphQL. Start the server and open the following url:

- http://localhost:4001/graphql (admin API)
- http://localhost:4002/graphql (end user API)

### Docker compose

The docker compose files are split into `docker-compose.yml` and `docker-compose.override.yml`.

By default, with `docker compose up`, docker will merge both files. The `docker-compose.override.yml` will expose ports on your host machine to various containers.

During CI testing we ignore the override file in order to contain tests within a docker network. This is achieved by specifically calling out the docker compose file to use ex: `docker compose -f docker-compose.yml up`.

## Testing

To run the full test suite you can run:

```bash
$ make test
```
Executing the full test suite requires [runtime dependencies](#runtime-dependencies).

### Run unit tests

```bash
$ yarn test:unit
# or
$ make unit
```

Runtime dependencies are not required for unit tests

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

### Run e2e tests

To execute the e2e tests [runtime dependencies](#runtime-dependencies) must be running.

```bash
$ yarn test:e2e
# or
$ make e2e
```

The e2e tests should be able to run multiple times without resetting dependencies, however they are *not* fully idempotent so if you are having issues you can reset the dependencies and run again with:
```
$ make reset-e2e
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

### Testing migrations

Migrations are stored in the `src/migrations` folder.
When developing migrations the best way to test them on a clean database is:
```
make test-migrate
```

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

When opening a PR please pay attention to having a [clean git history](https://medium.com/@catalinaturlea/clean-git-history-a-step-by-step-guide-eefc0ad8696d) with standard commit messages. We use the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) format for our commits.

It is the responsibility of the PR author to resolve merge conflicts before a merge can happen. If the PR is open for a long time a rebase may be requested.
