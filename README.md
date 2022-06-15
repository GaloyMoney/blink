# Galoy

### TLDR

Galoy is an opinionated bitcoin banking platform.

### Responsible disclosure 

Found critical bugs/vulnerabilities?
Please email them security@galoy.io Thanks!

### Get Started

Want to try it out and contribute? Checkout the [dev documentation](./DEV.md) to deploy locally with a docker compose script.

If you have questions, you can [join our Workspace](https://chat.galoy.io)

For an overview of all relevant repository checkout [awesome-galoy](https://github.com/GaloyMoney/awesome-galoy).
### Galoy-Backend features

- GraphqlAPI:
  - Public API following industry best practices
  - For [end clients](./src/graphql/main/schema.graphql). [Documentation](https://galoymoney.github.io/galoy/)
  - For [admin activities](./src/graphql/admin/schema.graphql)
- Authentication:
  - Code is sent via twillio to end users phone number which can be exchanged for jwt auth token
  - OAuth integration (in progress)
  - Account scoped API keys (in progress)
- Internal ledger:
  - Records all account activity via double entry accounting
  - Support for integrating fiat currencies (in progress)
  - CSV based export of all accounting data
- Contact list for frequent transaction partners
- Price
  - Sub-second [price data](https://github.com/GaloyMoney/price) polled from largest exchanges to record USD value at settlement
  - Historical price data can be queried for display for different time frames
- Send / Receive BTC payments
  - External settlement via OnChain or lightning
  - Automatic internal settlement when payer & payee are on the same galoy instance
  - Fees can be applied for sending / receiving for all settlement methods
  - Support for tipping via [dedicated web-frontend](https://github.com/GaloyMoney/galoy-pay)
  - Include memo to payment
- Lightning Network
  - Support for clearnet and TOR
  - Support for invoices with and without specified amount
  - Route probing to pre-display an accurate fee and mitigate attacks based on expensive routing
  - Channel data backup to dropbox and google cloud storage
- Custodial storage of all user assets
  - Limited funds stored in hot-wallet (keys kept on servers)
  - Threshold based rebalancing to cold-storage (keys stored on offline hardware devices)
- Security:
  - [Velocity check](https://www.linkedin.com/pulse/velocity-checks-fraud-prevention-scott-stone/) based on user verification level
  - Spam protection for sharing memos
  - Configurable 2fa for payments (in progress)
  - DDos prevention 
    - via rate limiting infront of critical APIs
    - via geetest CAPTCHA
- Resilience
  - Databases (mongodb and redis) are run by default in high availability/resilience mode. If one pod/node goes down, there is an automatic failover on another pod/node.
- Production ready
  - Supports horizontal scaling and highly available deployments via k8s
  - Client side load balancing across multiple LND nodes
  - Out-of-the-box dashboards for KPIs deployed to grafana showing metrics exported via prometheus
  - Quick response times thanks to pagination of large data sets
  - Returning error codes for full translation capability of the frontend
  - Instrumentation enabled for real-time insights into production runtime ([opentelemetry](https://opentelemetry.io) / [honeycomb](https://www.honeycomb.io))
- User on-boarding (optional)
  - Gamification via user quiz that pays out sats
  - Map of in-network merchants
- Notifications
  - Mobile clients can receive notifications of balance changes in real-time
  - Daily notification of balance for active end users

### Tech Stack

- GCP, Kubernetes, Terraform, Helm, Concourse, Docker
- Opentelemetry, Prometheus
- Bitcoind, LND, Specter, RideTheLightning, Loop, Lndmon, Pool
- PostgreSQL, MongoDB, Redis
- NodeJS
- Typescript
- GraphQL
- React + React Native
