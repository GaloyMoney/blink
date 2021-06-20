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
