# Apollo Federation

To generate the supergraph you need to run:
```
$ pnpm run write-sdl
```

which executes:
```
$ rover supergraph compose \
  --config dev/apollo-federation/supergraph-config.yaml \
  --elv2-license accept \
  > dev/apollo-federation/supergraph.graphql
```
