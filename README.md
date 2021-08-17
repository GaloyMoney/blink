# Galoy

### TLDR

Galoy is an opinionated bitcoin banking platform.

### Responsible disclosure 

Found critical bugs/vulnerabilities? 
Please email them security@galoy.io Thanks!

### Get Started

Want to try it out and contribute? Checkout the [dev documentation](./DEV.md) to deploy locally with a docker-compose script.

The production environment relies on kubernetes. To get your hands on a local kubernetes cluster with minikube, go to [INSTALLATION.md](https://github.com/GaloyMoney/galoy/blob/main/INSTALLATION.md).

If you have questions, you can [join our community Slack](https://join.slack.com/t/galoymoney-workspace/shared_invite/zt-rvnhsdb5-72AZCD_jzw6_Q05aCs0SgA)

## Genesis

Today’s wallets are typically on two ends of a spectrum: either custodial, managed by an exchange and often large, regulated corporations, or non-custodial, open source wallets.

There is really not much in the middle: a custodial wallet that is open source and one that can be deployed for a local community. This would enable any tech-savvy person to deploy a union-bitcoin-bank for their own community, anywhere in the world.

Galoy aims to bring this type of wallets to the bitcoin world.

This quote from [Hal Finney](https://bitcointalk.org/index.php?topic=2500.msg34211#msg34211) probably echoes best the vision in which Galoy would operates:

> Actually there is a very good reason for Bitcoin-backed banks to exist, issuing their own digital cash currency, redeemable for bitcoins. Bitcoin itself cannot scale to have every single financial transaction in the world be broadcast to everyone and included in the block chain. There needs to be a secondary level of payment systems which is lighter weight and more efficient. Likewise, the time needed for Bitcoin transactions to finalize will be impractical for medium to large value purchases.
>
> Bitcoin backed banks will solve these problems. They can work like banks did before nationalization of currency. Different banks can have different policies, some more aggressive, some more conservative. Some would be fractional reserve while others may be 100% Bitcoin backed. Interest rates may vary. Cash from some banks may trade at a discount to that from others.
>
> George Selgin has worked out the theory of competitive free banking in detail, and he argues that such a system would be stable, inflation resistant and self-regulating.
>
> I believe this will be the ultimate fate of Bitcoin, to be the "high-powered money" that serves as a reserve currency for banks that issue their own digital cash. Most Bitcoin transactions will occur between banks, to settle net transfers. Bitcoin transactions by private individuals will be as rare as... well, as Bitcoin based purchases are today.

## An open source bitcoin banking solution

There is plenty of effort to develop non-custodial wallets. But understanding how those wallets work is hard for people with a minimal tech background. Also, non-custodial wallets will likely not be economical in regards to their onchain fees for many low-income countries as highlighted in a prior article [Lightning as a retail payment system](https://medium.com/galoymoney/lightning-as-a-retail-payment-system-part-1-7463c46342ef).

On the other side of the spectrum, custodial wallets and exchanges have aggregated a large user base, which is against the idea and goal of decentralization brought by bitcoin. Those wallets are typically not open source because the entities behind it are seeking to maximize profit, and their wallet and matching engine represents a large part of their technical IP.

An open source bitcoin banking solution would have the benefits of pooling capital, and thus make the capital efficacy available to those users with the benefits of reduced fees like batch transactions, lightning channel management, no cost for “on us” transactions, and lower cost per user for maintaining online servers.

The risk of a custodial wallet can be reduced with multisig solutions where keys are spread around the community, and with a proof of reserve showing ongoing solvency of the bank. Also, if bitcoin banking is being developed within local communities, those banks would be small enough to not become a regulatory target like big banks/custodians are.

Those banks could be launched by anyone around the world because plugging into the bitcoin network is available to anyone, unlike traditional permissioned payment gateways.

## Status of the project

While the project is already deployed in a village in El Salvadaor and used by 1,000+ people, one should consider this project still in alpha stage.

The wallet is currently deployed in Google Cloud. The entire architecture is open source software so there should be no blocker to deploy on other cloud services that are Kubernetes compatible.

PRs welcomed to make this product more robust!
