import { toSats } from "@domain/bitcoin"
import { IncomingOnChainTxHandler } from "@domain/bitcoin/onchain/incoming-tx-handler"
import { WalletCurrency } from "@domain/shared"

describe("handleIncomingOnChainTransactions", () => {
  const balancesByKey = (amountsByKey: {
    [key: string]: bigint
  }): {
    [key: string]: BtcPaymentAmount
  } => {
    const balances: {
      [key: string]: BtcPaymentAmount
    } = {}
    for (const key of Object.keys(amountsByKey)) {
      balances[key] = {
        amount: amountsByKey[key],
        currency: WalletCurrency.Btc,
      }
    }
    return balances
  }

  const incomingTxns: IncomingOnChainTransaction[] = [
    // walletId0 1st txn
    {
      confirmations: 0,
      rawTx: {
        txHash: "txHash1" as OnChainTxHash,
        outs: [
          {
            sats: toSats(100),
            address: "walletId0-address1" as OnChainAddress,
          },
          {
            sats: toSats(200),
            address: "change-address1" as OnChainAddress,
          },
        ],
      },
      fee: toSats(0),
      createdAt: new Date(Date.now()),
      uniqueAddresses: () => [] as OnChainAddress[],
    },

    // walletId0 2nd txn
    {
      confirmations: 0,
      rawTx: {
        txHash: "txHash2" as OnChainTxHash,
        outs: [
          {
            sats: toSats(300),
            address: "walletId0-address2" as OnChainAddress,
          },
          {
            sats: toSats(400),
            address: "change-address2" as OnChainAddress,
          },
        ],
      },
      fee: toSats(0),
      createdAt: new Date(Date.now()),
      uniqueAddresses: () => [] as OnChainAddress[],
    },

    // walletId1 1st txn
    {
      confirmations: 0,
      rawTx: {
        txHash: "txHash3" as OnChainTxHash,
        outs: [
          {
            sats: toSats(500),
            address: "walletId1-address1" as OnChainAddress,
          },
          {
            sats: toSats(600),
            address: "change-address3" as OnChainAddress,
          },
        ],
      },
      fee: toSats(0),
      createdAt: new Date(Date.now()),
      uniqueAddresses: () => [] as OnChainAddress[],
    },

    // Tx with multiple outputs from walletId0 & walletId1
    {
      confirmations: 0,
      rawTx: {
        txHash: "txHash4" as OnChainTxHash,
        outs: [
          {
            sats: toSats(700),
            address: "walletId0-address1" as OnChainAddress,
          },
          {
            sats: toSats(800),
            address: "walletId0-address2" as OnChainAddress,
          },
          {
            sats: toSats(900),
            address: "walletId1-address1" as OnChainAddress,
          },
        ],
      },
      fee: toSats(0),
      createdAt: new Date(Date.now()),
      uniqueAddresses: () => [] as OnChainAddress[],
    },
  ]

  const handler = IncomingOnChainTxHandler(incomingTxns)

  describe("balance by address", () => {
    it("calculates balances by addresses in txns", () => {
      const expectedAmountsByAddress = {
        ["walletId0-address1"]: 800n,
        ["change-address1"]: 200n,
        ["walletId0-address2"]: 1100n,
        ["change-address2"]: 400n,
        ["walletId1-address1"]: 1400n,
        ["change-address3"]: 600n,
      }

      const balancesByAddress = handler.balancesByAddresses()
      expect(balancesByAddress).toStrictEqual(balancesByKey(expectedAmountsByAddress))
    })
  })

  describe("balance by wallet", () => {
    const walletsInitial = [
      {
        id: "walletId0",
        onChainAddressIdentifiers: [
          { pubkey: "pubkey", address: "walletId0-address1" },
          { pubkey: "pubkey", address: "walletId0-address2" },
        ],
      },
      {
        id: "walletId1",
        onChainAddressIdentifiers: [{ pubkey: "pubkey", address: "walletId1-address1" }],
      },
      {
        id: "walletId2",
        onChainAddressIdentifiers: [],
      },
    ]
    const wallets: Wallet[] = walletsInitial.map(
      (wallet) =>
        ({
          ...wallet,
          onChainAddresses: () =>
            wallet.onChainAddressIdentifiers.map(({ address }) => address),
        } as Wallet),
    )

    it("calculates balances for a set of wallets", () => {
      const expectedAmountsByWallet = {
        walletId0: 1900n,
        walletId1: 1400n,
        walletId2: 0n,
      }
      const expectedBalancesByWallet = balancesByKey(expectedAmountsByWallet)

      // Handles multiple wallets
      const balancesByWallets = handler.balanceByWallet(wallets)
      expect(balancesByWallets).toStrictEqual(expectedBalancesByWallet)

      // Handles a single wallet
      const balancesByWallet0 = handler.balanceByWallet([wallets[0]])
      expect(balancesByWallet0).toStrictEqual({
        walletId0: expectedBalancesByWallet.walletId0,
      })
      const balancesByWallet1 = handler.balanceByWallet([wallets[1]])
      expect(balancesByWallet1).toStrictEqual({
        walletId1: expectedBalancesByWallet.walletId1,
      })
      const balancesByWallet2 = handler.balanceByWallet([wallets[2]])
      expect(balancesByWallet2).toStrictEqual({
        walletId2: expectedBalancesByWallet.walletId2,
      })
    })
  })
})
