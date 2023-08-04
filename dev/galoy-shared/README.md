## To Run the Galoy Stack (Subgraph)

This syncs the basic core functionality of the Galoy stack so you can add it as a dependency in your project (subgraph). It enables:

- Login and get a token
- Light functionality of the ledger (send/receive)
- A copy of helpers for bat tests
- It does NOT yet include bria, stablesats or mongodb migrations

### Easy Curl Install
To install in a blank project, run this in the root of your project:
```
curl -sSL https://raw.githubusercontent.com/GaloyMoney/galoy/b76b45b98c6c75de58830b7e697f7982da084439/dev/galoy-shared/install.sh | sh
```

### Manual Install

```
cd dev/galoy-shared
vendir sync
cd vendor
chmod +x ./docker/run.sh
./docker/run.sh
```

After this runs you can open http://localhost:4002/graphql (galoy subgraph) and test (* it make take a few seconds for the galoy server to boot)

## To run a supergraph in your project
There some files you need to copy into your project to run a supergraph in docker-compose.

Copy these files:
- `vendor/docker/docker-compose.router.yml` to `YOUR_PROJECT_ROOT`
- `vendor/docker/docker-compose.router.override.yml` to `YOUR_PROJECT_ROOT`
- `vendor/dev/apollo-federation/router.yaml` to `YOUR_PROJECT_ROOT/dev/apollo-federation`

Next create a config file for your supergraph `YOUR_PROJECT_ROOT/dev/apollo-federation/supergraph-config.yaml`
Make sure to add your projects subgraph here
```
federation_version: =2.3.2
subgraphs:
  galoy:
    routing_url: http://bats-tests-subgraph:4002/graphql
    schema:
      file: ../galoy/vendor/graphql/src/graphql/main/schema.graphql
```

Then generate a supergraph
```
cd PROJECT_ROOT
rover supergraph compose --config dev/apollo-federation/supergraph-config.yaml --elv2-license accept --output dev/apollo-federation/supergraph.graphql
```

Finally combine and run with your main docker compose, here's an example:
```
docker compose -f docker-compose.router.yml -f docker-compose.router.override.yml --project-name my-subgraph up -d
```

Or if you have an existing docker-compose.yaml
```
docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.router.yml -f docker-compose.router.override.yml --project-name my-subgraph up -d
```

To test open the supergraph explorer at http://localhost:5004/graphql and you can run graphql like this:
```
mutation {
  userLogin(input: {
    phone: "+15555555555",
    code: "000000"
  }) {
    authToken
    errors {
      message
    }
  }
}
```
