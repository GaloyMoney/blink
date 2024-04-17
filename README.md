# Galoy

[![Mattermost](https://img.shields.io/badge/chat-on%20mattermost-blue?style=social&logo=mattermost)](https://chat.galoy.io)
[![GitHub Repo stars](https://img.shields.io/github/stars/GaloyMoney/galoy?style=social)](https://github.com/GaloyMoney/galoy/stargazers)
[![Twitter Follow](https://img.shields.io/twitter/follow/GaloyMoney?style=social)](https://twitter.com/GaloyMoney)

## 💡 Get help
[Q&A](https://github.com/GaloyMoney/galoy/discussions) or [Mattermost 💬](https://chat.galoy.io)

## TLDR

Galoy is an opinionated Bitcoin banking platform.

This repo represents the main API that brings all functionality together.

## Responsible Disclosure

Found critical bugs/vulnerabilities?
Please contact our team by email at security@galoy.io . 

## Get Started

Want to try it out and contribute? Check out the [dev documentation](./docs/DEVELOPMENT_ENVIRONMENT.md) to deploy locally with a docker-compose script.

If you have questions, you can [join our Workspace](https://chat.galoy.io)

For an overview of all relevant repositories checkout [awesome-galoy](https://github.com/GaloyMoney/awesome-galoy).

## Galoy-Backend features

- GraphQL API:
  - Public API following industry best practices
  - [Schema for end clients](./core/api/src/graphql/public/schema.graphql)
    - [Reference](https://dev.galoy.io/public-api-reference.html)
    - [Documentation for the Blink hosted instance](https://dev.blink.sv)
  - [Schema for admin activities](./core/api/src/graphql/admin/schema.graphql)
    - [Reference](https://dev.galoy.io/admin-api-reference.html)
- Authentication:
  - Dedicated REST API to obtain an authentication token by logging in with:
    - phone by receiving a code via SMS or Whatsapp using Twilio
    - email by receiving a code via email
  - OAuth is integrated to be used in the Dashboard (example: [Blink Dashboard](https://dashboard.blink.sv))
  - Account scoped API keys can be created in the Dashboard with custom permissions and expiry
- Internal ledger:
  - Records all account activity via double entry accounting
  - Supports several fiat currencies
  - CSV based export of all accounting data
- Contact list for frequent transaction partners
- Price
  - Sub-second [price data](https://github.com/GaloyMoney/price) polled from the largest exchanges to record USD value at settlement
  - Historical price data can be queried for display for different time frames
- Send / Receive BTC payments
  - External settlement via lightning or onchain
  - Automatic internal settlement when payer & payee are on the same galoy instance
  - Fees can be applied for sending / receiving for all settlement methods
  - Support for tipping via [dedicated web-frontend](https://github.com/GaloyMoney/galoy-pay)
  - Include memos to payments
  - Advanced onchain functions via [Bria](https://github.com/GaloyMoney/bria)
    - advanced fee estimation
    - automatic transaction batching
    - automated CPFP to avoid stuck payments
    - PSBT based remote signing
- Lightning Network
  - Support for clearnet and Tor
  - Support for invoices with and without a specified amount
  - Route probing to pre-display an accurate fee and mitigate attacks based on expensive routing
  - Static Channel Backup backup to S3 and Google Cloud storage
  - Automatic liquidity management
    - Balancing of channels between the internal nodes
    - Submarine swaps
- Custodial storage of all user assets
  - Limited funds stored in hot-wallet (keys kept on servers)
  - Threshold based rebalancing to cold-storage (keys stored on offline hardware devices)
- Security:
  - [Velocity check](https://www.linkedin.com/pulse/velocity-checks-fraud-prevention-scott-stone/) based on user verification level
  - Spam protection for sharing memos
  - Configurable 2fa for payments (in progress)
  - DDoS prevention
    - via rate limiting infront of critical APIs
    - via geetest CAPTCHA
- Resilience
  - Databases (PostgreSQl, MongoDB and Redis) are run by default in high availability/resilience mode. If one pod/node goes down, there is an automatic failover on another pod/node.
- Production ready
  - Supports horizontal scaling and highly available deployments via k8s
  - Client side load balancing across multiple LND nodes
  - Out-of-the-box dashboards for KPIs deployed to Grafana showing metrics exported via Prometheus
  - Quick response times thanks to the pagination of large data sets
  - Returning error codes for full translation capability of the frontend
  - Instrumentation enabled for real-time insights into production runtime ([opentelemetry](https://opentelemetry.io) / [honeycomb](https://www.honeycomb.io))
- User onboarding (optional)
  - Gamification via user quiz that pays out sats
  - Map of in-network merchants
- Notifications
  - Mobile clients can receive notifications of balance changes in real-time
  - Optional notification of balance for active end users

## Local Development Setup

Running the Galoy software locally can be done in a variety of ways, but this abbreviated section will focus on a single method for
getting your environment ready to run the stack.
For more information and options on running Galoy locally, see the [development environment documentation](./docs/DEVELOPMENT_ENVIRONMENT.md).

### (1) Choose a Supported Platform

Currently developing on MacOS and Linux is supported.

### (2) Install Dependencies

Install dependencies on your chosen platform.

- **1)** [`nix` with flakes enabled](https://github.com/DeterminateSystems/nix-installer)
- **2)** `docker` from [Docker Desktop](https://www.docker.com/products/docker-desktop/) or [Docker Engine](https://docs.docker.com/engine/)
- **3a)** [`direnv`](https://direnv.net) version `>= 2.30` installed
- **3b)** [`direnv` hooked into your shell](https://direnv.net/docs/hook.html)

For `nix`, we highly recommend using the [Determinate Nix Installer](https://github.com/DeterminateSystems/nix-installer).

For `docker`, the Docker Desktop version corresponding to your native architecture should be used.

For `direnv`, you can install it with [your package manager of choice](https://direnv.net/docs/installation.html).
However, if you're unsure which installation method to use or your package manager does not provide a compatible version,
you can use `nix` itself (e.g. `nix profile install nixpkgs#direnv`).

> We recommend using [the upstream docs for hooking `direnv` into your shell](https://direnv.net/docs/hook.html), but here is an example on how to do it
> on a system where `zsh` is the default shell.
> In this example, the following is added to the end of `~/.zshrc`.
>
> ```zsh
> if [ $(command -v direnv) ]; then
>    eval "$(direnv hook zsh)"
> fi
> ```

### (3) Enter the Repository Directory

All commands need to be run from the `nix` environment.
Since `direnv` is installed _and_ hooked into your shell, you can `cd` into
the repository and `nix` will bootstrap the environment for you using the flake.

_Please note: you may notice a large download of dependencies when entering the repository for the first time._

### (4) Running the Stack

We use [**buck2**](https://github.com/facebook/buck2) to run the stack, run and build individual services and libraries, perform lints and tests, etc.

_Before continuing, you should stop any locally running services to avoid conflicting ports with the stack.
Some of the services that will run include, but are not limited to the following: PostgreSQL, OpenTelemetry, MongoDB.

Check if you are ready to run the stack before continuing.

```bash
buck2 run dev:healthcheck
```

You may notice some checks related to resource limits.
On macOS and in WSL2 in particular, we recommend significantly increasing the file descriptor limit for `buck2` to work as intended (e.g. `ulimit -n 10240`).
_Please note: the new file descriptor limit may not persist to future sessions._

Once ready, we can build relevant services and run the entire stack locally.

```bash
buck2 run dev:up
```

Once Tilt starts, you can check on the status of all services by accessing the UI through the given port on your local host (e.g. [http://localhost:10350/](http://localhost:10350/)).
Every service should eventually have a green checkmark next to them, which ensures that they are in "ready" states.


### (5) Test account credentials

For account login, you can input any random mobile number/email and then use `000000` as the OTP.

### (6) Troubleshooting in Tilt

If some services fail to start, you can restart them on the Tilt dashboard.

### (7) Tearing Down the Stack

The following command will stop all running services and containers.
It will also remove the containers and, consequentially, the data held in them.

```bash
buck2 run dev:down
```

## Run integration tests with Galoy as a dependency?

Take a look at the [Quickstart](./quickstart) if you want to take it for a spin.
