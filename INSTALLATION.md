# Installation

There are multiple ways to install the galoy servers. We recommend first trying it out on your local machine with minikube.

## Local installation

### Prerequisites
1. Node.js
2. Yarn
3. Docker
4. [Helm v3](https://helm.sh/docs/intro/install/)


### Steps

1. Install [minikube](https://minikube.sigs.k8s.io/docs/start/) and make sure you're able to deploy the hello-world starter application
2. Run `git clone https://github.com/galoymoney/galoy && cd galoy`
3. Run `yarn install`
4. Run `yarn add-charts`

This will setup all the required pods. Note that this will setup the environment in **regtest** mode. Read more about regtest mode [here](https://developer.bitcoin.org/examples/testing.html#regtest-mode).