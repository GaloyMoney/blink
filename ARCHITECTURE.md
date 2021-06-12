## Kubernetes

Galoy focuses on reliability and redundancy. This is why we are relying on kubernetes for orchestrating the different services we are using.

Cloud platforms are the best way to maintain reliability. This also comes with a security tradeoff of having keys on servers physically controlled by a third party. We are mitigating this with a cold storage strategy. 

To operate, Lightning nodes have to have at least some funds with keys online. We also keep funds online for a portion of the onchain wallet for users who want to send funds over the layer 1. 

Kubernetes comes with some overhead, and while we have not tried to run on low-cost devices such as a raspberry pi, we assume this may not be the best platform to run a bitcoin bank that may have thousands of users, or more. However if you want to give it a try, we'll be glad to see how it goes! 

https://twitter.com/memenetes/status/1366826625531342856?s=20

### Deps

Galoy relies on bitcoind and lnd to process transactions. Those dependencies can be installed conveniently from the following [helm chart](https://github.com/GaloyMoney/charts)

Currently Galoy relies on a single lnd instance, but the goal is to be able to manage several lnd instances at the same time, so that lnd can be recycled when needed, and also provide reliability when downtime is needed or to provide multi-region redundancy.

Lnd itself is also adding etcd as another backend option to bring more resilicency; this will be another option when available that will bring more resiliency to Galoy

### Main pods

The main service is run through a graphql server. 

The graphql server can scale horizontally with additional pods.

Redis is being used as a distributed lock such that several accounts can't be modified at the same time by different instances. 

### Database

Mongodb is the main database which is storing the transactions. It's the source of truth for the customers' accounts.

It's currently setup by default with auto replication on a 2-out-of-3 setup, and writes are only accepted as successful when a majority (2) of the nodes have 
