## Galoy Postman Collection

We've included the following files here that can be imported into Postman to get up-and-running with the Galoy API.

**Collection:**
- `galoy_graphql_main_api.postman_collection.json`: the collection of all queries and mutations

**Environment variables:**
- `galoy-dev.postman_environment.json`: environment variables to hit our testing local setup
- `galoy-staging.postman_environment.json`: environment variables to hit our deployed staging with _testnet_ bitcoin
- `galoy-mainnet.postman_environment.json`: environment variables to hit our deployed Bitcoin Beach Wallet production environment with _mainnet_ bitcoin

### Usage

To use these, simply import the collection and the respective environment variable files into postman.

#### Local `dev` API access
For the local `dev` environment, use the following commands to start hosting the api locally:
```
$ TEST="01|02" make reset-integration
$ make start-main
```
You can then use the mutations in the `login flow` folder to login as one of the test accounts defined in the `default.yaml` file (one is already auto-populated).

#### `staging` and `mainnet` API access

For the `staging` and `mainnet` environments, the auth code endpoints are protected behind a captcha. To get around this, you can create an account and login using our web wallets ([staging](https://wallet.staging.galoy.io) & [mainnet](https://wallet.mainnet.galoy.io)) and then grab the authentication token for your browser's local storage and add it to the `token` property in the environment variables.
