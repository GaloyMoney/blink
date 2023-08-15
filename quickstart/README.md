# Galoy Quickstart

This folder hosts all configuration needed to run the galoy stack locally to play with or run tests against (when embedded into another project).

## Playground:

To open the graphql playground start docker compose and bring up the public endpoint of the oathkeeper proxy in your browser.
```
docker compose up -d
open http://localhost:4002/graphql
```

## Embedded

To embed galoy as a dependency, we recommend syncing this folder via vendir:

install `vendir` and `ytt`:
```
brew tap carvel-dev/carvel
brew install vendir ytt
```

follow those instructions to get a docker compose that will contain a minimal viable setup for running the Galoy stack locally
```
cd <path/to/your/repo>

# download the vendir configuration
curl https://raw.githubusercontent.com/GaloyMoney/galoy/main/quickstart/quickstart.vendir.yml > vendir.yml

# synchronize vendor folder
vendir sync

# set HOST_PROJECT_PATH and COMPOSE_PROJECT_NAME to your environment. 
# it's not mandatory, but we're using direnv here to auto reload the env variables
echo 'export HOST_PROJECT_PATH="$(pwd)"' >> .envrc
echo 'export COMPOSE_PROJECT_NAME="$(basename $PWD)"' >> .envrc
direnv allow

# launch docker
docker compose -p $(basename "$PWD") -f ./vendor/galoy-quickstart/docker-compose.yml up -d
```

If you want to use `docker compose`, you need to keep the "prefix": `-p $(basename "$PWD") -f ./vendor/galoy-quickstart/docker-compose.yml `
You can create an alias like:
```
alias dp="docker compose -p $(basename "$PWD") -f ./vendor/galoy-quickstart/docker-compose.yml"
dp up -d
dp ps
```
