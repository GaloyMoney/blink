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

```
cd <path/to/your/repo>
https://raw.githubusercontent.com/GaloyMoney/galoy/main/quickstart/quickstart.vendir.yml > vendir.yml
vendir sync
docker compose -p $(basename "$PWD") -f ./vendor/galoy-quickstart/docker-compose.yml up -d
```
