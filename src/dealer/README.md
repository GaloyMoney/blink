## USD synthetic contract

Lightning, as a layer 2 for Bitcoin (the network), use Bitcoin (the assets) as it's currency. 

But, in many places, people still prefers to own/transact in USD over BTC.

The good news is that it's possible to combine both:
- Using Lightning network to transact
- Use derivative market to hedge dynamically, such that the funds hold have a constant balance in USD

By combining Lightning network with a derivative market, it's possible to have instant settlement across the world, with USD as the assets.


This folder have a first implementation with FTX.
Other implementation for other exchanges are on their ways, with a goal of: 
1. let the exchange choose which exchange to work with
2. hedge across different market, and maximasize the cash and carry arbitrage

### Drawback of FTX

Ftx currently only have "linear" contract. One of the drawback of such appraoch is that a continuous rebalancing is needed when the price move.

This is because the contract are priced in BTC. But we want a contant amount of dollar hedged, so we actually really need a contract priced in USD.

So-called Inverse contract are actually more relevant in the goal of hedging, because no rebalancing is needed 

### Perpetual futures versus monthly/quaterly futures

To ease the implementation, perpetual futures are being used. 

One of the drawback of such approach is that, because the funding is not prectitible, there is some odds (even if low) that funding turn negative (for the short positive) which would result is loosing money by keeping the positive. 

Historically, negative funding rate is sustainaibly over 0 over a period of a week. but black swan event like March 12 2020 shows that this is not always the case

We intent to also to add hedging through monthly and quaterly because there is not any variable funding, or unknown: 
It's known in advance what is the rate of return at the time the bot will enter the short position with certainty

### Leverage

To limit the solvency/hack exchange risk, it's recommended to use leverage. The idea is that instead of having  having USD100 and a short position of -1 for every USD100 customers want to keep, it's possible to have only USD20 in the exchange and a short positionve of -5. 

The drawback of leverage is that in case of extreme move, the position can be liquidated. With a limited amoutn of leverage position (ie: 5x), this would mean that rebalancing/reheding should be before an increase of the BTC/USD by a factor of 20%

The main side effect can arise when fees are also on the rise, such that the transaction initiated by the bot would not get mined in time. RBF is currently used by default, so that fees can be bumped in such scenario, with a manual intervention (this could be automated). 

Leveraged position should be actively monitored during period of high volatility.

## Dealer

The goal of the dealer is to:
- maintain a hedge such that USD that customer hold is hedged, and change the position as customers received/send dollar over lightning
- keep a limited but enough balance on the exchange, and rebalance if necessary to/from the exchange
- re-hedge as the price changed (this would not be necessary any more with )

## Architecture

The dealer has an account like any other users in the platform.
