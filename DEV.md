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

## Testing

To execute the test suite runtime dependencies must be running.
```
$ make start-deps
docker-compose up -d
(...)
```

Everytime the dependencies are re-started the environment must be reloaded via `direnv reload`. When using the [make command](./Makefile) this will happen automatically.

To run the test suite you can run:
```
$ make integration
(...)
$ echo $?
0
```

The tests are *not* idempotent (yet) so currently to re-run the tests you must reset the dependencies:
```
$ make reset-deps
(...)
$ make integration
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
