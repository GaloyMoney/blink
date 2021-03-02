## Ledger

Galoy relies on a ledger as the source of truth to maintain accounts of the users.

From a 10000 foot view, this is how this looks like: 

wallet Type | Assets | Liablities
--- | --- | ---
hot wallet offchain (lnd) | BTC | users accounts
hot wallet onchain (lnd) | BTC | users accounts
cold storage multisig onchain (bitcoind) | BTC | users accounts
.


The basic law of accounting grand that Assets = Liabilities, therefore this means the total amount of BTC in the accounts of users should be equal to the BTC that the lightning nodes, and the bitcoind server manages.

This is also referred in the finance industry as an omnibus account.

Typically, users account are in the `Liablities` subaccount, while BTC holding, whether it's in hot or cold wallet, are in the `Assets` account

## Profit/Loss of the wallet, and Equity

In practice, for the account to balance, there is more complexity than what is shown above.

Running a Lightning wallet involve ongoing costs:
- opening channels
- closing channels

Because funds are typically stored in cold wallet, there are also onchain fees to rebalance to and from the cold wallet.

Also, there are channel escrow. the escrow vary depending on the current market fee on the bitcoin network. This also needs to be handled to have real time reconciliation of all the accounts.


Lightning wallet also generate revenues, in the form of routing fees, or capital lending (Pool). 

In additional, banks may decide to charge additional fees on top of the layer 1 and layer 2 as a way to generate income and maintain server costs, payroll, etc.

Those revenue may or may not offset the fees mentionned above. Basic rules of account makes it that if the fees are cumulatively higher than the revenue, then the bank is operating at a loss. And this loss must be compensated by some Equity.

At the architecture level, the `Equity` account is currently coded in the `Liabilities` book. This is not the standard from an accounting point of view, but makes initial development easier.

## Real time reconciliation

Data from the assets and liabilities are generated and exporter as a prometheus metrics to be able to follow in real time the status of the Assets and Liabilities

It's intended in a future version of the app to have a proof of solvency such that every users can check that the bank have money to cover liabilities (to the extend this is possible with Lightning... if you're interested and have teh cryptographic knowledge to help, shoot us a message!)

## Ledger

The ledger is using mongodb and rely on the [medici](https://github.com/flash-oss/medici) package. 

medici is enforcing the fact that every journal entry must have `debit = credit` to be valid.
