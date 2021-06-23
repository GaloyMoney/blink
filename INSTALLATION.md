# Installation

There are multiple ways to install the galoy servers. We recommend first trying it out on your local machine with minikube.

## Local installation

### Prerequisites
1. Node.js
2. Yarn
3. [Helm v3](https://helm.sh/docs/intro/install/)
4. [Minikube](https://minikube.sigs.k8s.io/docs/start/)

### Steps

1. Make sure minikube is working correctly by deploying [hello-world starter application](https://minikube.sigs.k8s.io/docs/start/)
2. Run `git clone https://github.com/galoymoney/galoy && cd galoy`
3. Run `yarn install`
4. Run `yarn add-charts`

This will setup all the required pods. Note that this will setup the environment in **regtest** mode. Read more about regtest mode [here](https://developer.bitcoin.org/examples/testing.html#regtest-mode).

#### Caveats
1. If installing on macOS, this script will clash with the default grep, [here is a workaround](https://stackoverflow.com/questions/16658333/grep-p-no-longer-works-how-can-i-rewrite-my-searches): `brew install grep`

#### Running ESLint

Follow the instructions [above](#steps), then run `yarn eslint-check`. This has to pass for the CI build to be accepted. It's recommended that you install an ESLint plugin in your editor and/or run this task in a local pre-commit hook.

#### Running the test suite

Follow the instructions [above](#steps), then run `yarn test-local`

#### Running the graphql server

Follow the instructions [above](#steps), then run `yarn start`.

Alternatively, to start the server in watch mode with hot reloading, run `yarn watch`.
