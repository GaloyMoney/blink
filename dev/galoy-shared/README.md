## To Run the Galoy Stack (Subgraph)

This syncs the basic core functionality of the Galoy stack so you can add it as a dependency in your project (subgraph). It enables:

- Login and get a token
- Light functionality of the ledger (send/receive)
- A copy of helpers for bat tests
- It does NOT yet include bria, stablesats or mongodb migrations

```
cd dev/galoy-shared
vendir sync
cd vendor
chmod +x ./docker/run.sh
./docker/run.sh
```

After this runs you can open http://localhost:4002/graphql (galoy subgraph) (* it make take a few seconds for the galoy server to boot)

## To run a supergraph in your project
There some files you need to copy into your project to run a supergraph in docker-compose.

Copy these files:
- `vendor/docker/docker-compose.router.yml` to `YOUR_PROJECT_ROOT`
- `vendor/docker/docker-compose.override.router.yml` to `YOUR_PROJECT_ROOT`
- `vendor/dev/apollo-federartion/router.yaml` to `YOUR_PROJECT_ROOT/dev/apollo-federation`
- `vendor/dev/apollo-federartion/supergraph-config.yaml` to `YOUR_PROJECT_ROOT/dev/apollo-federation`

Then combine and run with your main docker compose, here's an example:
```
docker compose -f docker-compose.yml -f docker-compose.router.yml --project-name my-subgraph up -d
```
