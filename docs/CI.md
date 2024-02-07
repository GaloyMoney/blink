# Documentation

The files in `./ci` are responsible for configuring our different Galoy Concourse ci pipelines.

When material changes are made here, they can be enforced by running the respective `repipe` scripts:

- `./ci/core/repipe`
- `./ci/apps/repipe`

Note: `fly` would need to have been configured locally for this to successfully complete (see internal `galoy-deployments` docs for more details).
