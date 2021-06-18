# Dev environment


Clone the repo and install dependencies:
```
$ git clone git@github.com:GaloyMoney/galoy.git
$ cd galoy
$ yarn install
```

We use [direnv](https://direnv.net) to load environment variables needed for running the integration tests.
```
$ direnv allow
direnv reload
direnv: direnv: loading ~/projects/GaloyMoney/galoy/.envrc
(...)
```

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
