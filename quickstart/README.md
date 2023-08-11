# Galoy Quickstart

This folder hosts all configuration needed to run the galoy stack locally to play with or run tests against (when embedded into another project).

## Playground:

To open the graphql playground start docker compose and bring up the public endpoint of the oathkeeper proxy in your browser.
```
docker compose up -d
open http://localhost:4002/graphql
```

## Embedded

To embed galoy as a dependency we recommend syncing this folder via vendir:

install vendir if not already:
```
brew tap carvel-dev/carvel
brew install vendir
```

```
cd <path/to/your/repo>

# download the vendir configuration
curl https://raw.githubusercontent.com/GaloyMoney/galoy/main/quickstart/quickstart.vendir.yml > vendir.yml

# synchronize vendor folder
vendir sync

# set HOST_PROJECT_PATH to your environement. we're using direnv here.
echo 'export HOST_PROJECT_PATH="$(pwd)"' >> .envrc
direnv allow

# launch docker
docker compose -p $(basename "$PWD") -f ./vendor/galoy-quickstart/docker-compose.yml up -d
```


if you want to use `docker compose`, you need to keep the "prefix": `-p $(basename "$PWD") -f ./vendor/galoy-quickstart/docker-compose.yml `
ie:

`docker compose -p $(basename "$PWD") -f ./vendor/galoy-quickstart/docker-compose.yml ps`