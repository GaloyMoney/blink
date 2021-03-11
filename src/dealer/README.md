## USD synthetic contract

Lightning, as a layer 2 for Bitcoin (the network), use Bitcoin (the asset) as its currency. 

But, in many places, people still prefer to own/transact in USD over BTC.

The good news is that it's possible to combine both:
- Using Lightning network to transact
- Using the derivatives market to hedge dynamically, such that the funds held have a constant balance in USD

By combining the Lightning network with a derivative market, it's possible to have instant settlement across the world, with USD as the asset.


This folder has a first implementation with FTX.
Other implementations for other exchanges are on their ways, with a goal of: 
1. Allowing to choose which exchange to work with
2. Hedging across different markets, thus maximizing the cash and carry arbitrage

### Drawback of FTX

Ftx currently only has a "linear" contract. One of the drawbacks of such an approach is that continuous rebalancing is needed when the price moves.

This is because the contract is priced in BTC. But we want a constant amount of dollars hedged, so we actually really need a contract priced in USD.

So-called Inverse contracts are actually more relevant to the goal of hedging, because no rebalancing is needed.

### Perpetual futures versus monthly/quarterly futures

To ease the implementation, perpetual futures are being used.

One of the drawbacks of such an approach is that, because the funding is not predictable, there are some odds (even if low) that the funding turns negative (for the short positive) which would result in losing money by keeping the positive.

Historically, negative funding rate is sustainable over 0 over a period of a week, but black swan events like March 12 2020 show that this is not always the case.

We intend to also to add hedging through monthly and quarterly because there is not any variable funding, or unknown: 
It's known in advance what is the rate of return at the time the bot will enter the short position with certainty

### Leverage

To limit the solvency/hack exchange risk, it's recommended to use leverage. The idea is that instead of having 100 USD and a short position of -1 for every 100 USD customers want to keep, it's possible to have only 20 USD in the exchange and a short position of -5. 

The drawback of leverage is that in case of extreme price moves, the position can be liquidated. With a limited amount of leverage position (ie: 5x), this would mean that rebalancing/rehedging should be before an increase of the BTC/USD by a factor of 20%

The main side effect can arise when fees are also on the rise, such that the transaction initiated by the bot would not get mined in time. RBF is currently used by default, so that fees can be bumped in such a scenario, with a manual intervention (this could be automated). 

Leveraged position should be actively monitored during period of high volatility.

## Dealer

The goal of the dealer is to:
- maintain a hedge such that USD that customers hold is hedged, and change the position as customers receive/send dollars over lightning
- keep a limited but enough balance on the exchange, and rebalance if necessary to/from the exchange
- re-hedge as the price changes (this would not be necessary any more with )

## Architecture

The dealer has an account like any other user in the platform.
