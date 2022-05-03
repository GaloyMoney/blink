## Wallets

To operate, Lightning nodes have to have at least some funds with keys online. We also keep funds online for a portion of the onchain wallet for users who want to send funds over the layer 1. all the hot wallet are currently using lnd.

The cold storage is done with a multi sig wallet. This wallet is operated by bitcoind, and the orchestration of the signature is done with Specter.

## Kubernetes

Galoy focuses on reliability and redundancy. This is why we are relying on kubernetes for orchestrating the different services we are using.

Cloud platforms are the best way to maintain reliability. This also comes with a security tradeoff of having keys on servers physically controlled by a third party. We are mitigating this with a cold storage strategy.

Kubernetes comes with some overhead, and while we have not tried to run on low-cost devices such as a raspberry pi, we assume this may not be the best platform to run a bitcoin bank that may have thousands of users, or more. However if you want to give it a try, we'll be glad to see how it goes!

https://twitter.com/memenetes/status/1366826625531342856?s=20

![Overall diagram](https://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/GaloyMoney/galoy/main/architecture.iuml)


### Deps

Galoy relies on lnd to process transactions. The dependency of lnd, and bitcoind as the backend, can be installed conveniently from the following [helm chart](https://github.com/GaloyMoney/charts)

Currently Galoy relies on a single lnd instance, but the goal is to be able to manage several lnd instances at the same time, so that lnd can be recycled when needed, and also provide reliability when downtime is needed, or to provide multi-region redundancy.

Lnd itself is also adding etcd as another backend option to bring more resilicency; this will be another option when available that will bring more resiliency to Galoy

### Main pods

The main service is run through a graphql server.

The graphql server can scale horizontally with additional pods.

Redis is being used as a distributed lock such that several accounts can't be modified at the same time by different instances.

## Database

The state of the wallet is shared among 4 differences sources:

### bitcoin-core

Bitcoin core handles the cold storage.

There is typically a very low load transaction wise in regard to the wallet. Typically 1 transaction per week when a rebalancing is needed.

### lnd

Lnd handles all of the transactions the users make.
Lnd stores the data in a bbolt database internally.

Every successful payment within lnd is being recorded on mongodb.

Offchain-wise, nothing is needed within the lnd side to present a transaction to a user after it has been executed.
Onchain-wise, it's possible that a user shared an onchain address. This is currently tied to lnd. (we intend to not use lnd for onchain transaction to remove this dependency and simplify lnd instance recycling)

### Mongodb

Mongodb is the database storing all users' transactions. It's the source of truth for the customers' accounts.

To achieve strong consistency, it's currently setup in the following way:
- Write access needs to be valided by 2-out-of-3 pods before being considered successful
- Schema on write with mongoose

The accounting part is being done by [medici](https://github.com/flash-oss/medici/commits/master).

There is no transaction used yet (the main inconsistency if this were to happen would be between the journal entries and the transaction entries). A [contribution on this](https://github.com/flash-oss/medici/issues/23) is welcome. It has not been a focus yet because there hasn't been any issue on this yet.

### Redis

Redis is used for a distributed lock, such that the number of replicas for the node/graphql can be scaled as needed.
Redis is also used for query rate limiting, and to store ephemeral data such as result of route probing.

Redis can be thought of as a cache. The data can be deleted as needed (it would reset the lock, so some attention needs to be paid to this if some live queries are running)
