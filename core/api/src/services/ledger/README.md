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

This is also referred to in the finance industry as an omnibus account.

Users' accounts are a `Liablities` sub account, while BTC holdings, whether stored in hot or cold wallets, are in the `Assets` account - keep in mind that Assets and Liabiliries are from the point of the bank here, not the user.

## Profit/Loss of the wallet, and Equity

In practice, for the all accounts to balance, there is more complexity than what is shown above.

Running a bitcoin bank over lightning involves ongoing costs:
- opening channels
- closing channels

Also, as funds are stored both in cold and hot wallets with some rebalancing threshold, there are  onchain fees related to the rebalancing that would not be associated to a single user but to the bank owner.

Additionally, there are escrow funds in channel. The escrow varies depending on the current market fee on the bitcoin network. This also needs to be handled to have real time reconciliation of all the accounts. (note: this is only the case for non anchored channel)


Lightning wallet also generate revenues, in the form of routing fees, or capital lending (Pool). 

Additionally, banks may decide to charge additional fees on top of the layer 1 and layer 2 as a way to generate income and maintain server costs, payroll, etc.

This revenue may or may not offset the fees mentioned above. Basic rules of account makes it that if the fees are cumulatively higher than the revenue, then the bank is operating at a loss. And this loss must be compensated by some Equity.

The "bankowner" user is the account from which revenue and expenses are being charges to.

Some expenses are not been recorded yet to this account, including:
- rebalancing from cold storage to the hot wallet


## Real time dashboard

Data from the assets and liabilities is generated and exported as prometheus metrics to be able to follow in real time the status of the Assets and Liabilities

It's intended in a future version of the app to have a proof of solvency such that every user can check that the bank has enough money to cover liabilities (to the extent this is possible with Lightning... if you're interested and have the cryptographic knowledge to help, shoot us a message!)

## Ledger

The ledger is using mongodb and relies on the [medici](https://github.com/flash-oss/medici) package. 

Medici is enforcing the fact that every journal entry must have `debit = credit` to be valid.
