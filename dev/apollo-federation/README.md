# Apollo Federation

To generate the supergraph you need to run:
```
$ yarn write-sdl
```

which executes:
```
$ rover supergraph compose \
  --config dev/apollo-federation/supergraph-config.yaml \
  --elv2-license accept \
  > dev/apollo-federation/supergraph.graphql
```

### Run the explorer for the Galoy Subgraph

- install latest version of rover, if you have not already
`curl -sSL https://rover.apollo.dev/nix/latest | sh`
```
make start
rover dev --url http://localhost:4004/graphql -p 5000 -n public
```

# Run the Supergraph Explorer
```
cd ./dev/apollo-federation
rover dev --supergraph-config supergraph-config.yaml -p 5000
```

