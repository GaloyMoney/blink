import { toSats } from "@/domain/bitcoin"
import { IncomingOnChainTxHandler } from "@/domain/bitcoin/onchain/incoming-tx-handler"
import { WalletCurrency } from "@/domain/shared"

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

  const newIncomingTxns: WalletOnChainSettledTransaction[] = [
    // walletId0 1st txn: vout 0
    {
      settlementAmount: toSats(100),
      settlementCurrency: WalletCurrency.Btc,
      initiationVia: {
        address: "walletId0-address1" as OnChainAddress,
      },
    } as WalletOnChainSettledTransaction,

    // walletId0 1st txn: vout 1
    {
      settlementAmount: toSats(200),
      settlementCurrency: WalletCurrency.Btc,
      initiationVia: {
        address: "change-address1" as OnChainAddress,
      },
    } as WalletOnChainSettledTransaction,

    // walletId0 2nd txn: vout 0
    {
      settlementAmount: toSats(300),
      settlementCurrency: WalletCurrency.Btc,
      initiationVia: {
        address: "walletId0-address2" as OnChainAddress,
      },
    } as WalletOnChainSettledTransaction,

    // walletId0 2nd txn: vout 1
    {
      settlementAmount: toSats(400),
      settlementCurrency: WalletCurrency.Btc,
      initiationVia: {
        address: "change-address2" as OnChainAddress,
      },
    } as WalletOnChainSettledTransaction,

    // walletId1 1st txn: vout 0
    {
      settlementAmount: toSats(500),
      settlementCurrency: WalletCurrency.Btc,
      initiationVia: {
        address: "walletId1-address1" as OnChainAddress,
      },
    } as WalletOnChainSettledTransaction,

    // walletId1 1st txn: vout 1
    {
      settlementAmount: toSats(600),
      settlementCurrency: WalletCurrency.Btc,
      initiationVia: {
        address: "change-address3" as OnChainAddress,
      },
    } as WalletOnChainSettledTransaction,

    // Tx with multiple outputs from walletId0 & walletId1: vout 0
    {
      settlementAmount: toSats(700),
      settlementCurrency: WalletCurrency.Btc,
      initiationVia: {
        address: "walletId0-address1" as OnChainAddress,
      },
    } as WalletOnChainSettledTransaction,

    // Tx with multiple outputs from walletId0 & walletId1: vout 1
    {
      settlementAmount: toSats(800),
      settlementCurrency: WalletCurrency.Btc,
      initiationVia: {
        address: "walletId0-address2" as OnChainAddress,
      },
    } as WalletOnChainSettledTransaction,

    // Tx with multiple outputs from walletId0 & walletId1: vout 2
    {
      settlementAmount: toSats(900),
      settlementCurrency: WalletCurrency.Btc,
      initiationVia: {
        address: "walletId1-address1" as OnChainAddress,
      },
    } as WalletOnChainSettledTransaction,
  ]

  const handler = IncomingOnChainTxHandler(newIncomingTxns)
  if (handler instanceof Error) throw handler

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
          { address: "walletId0-address1" },
          { address: "walletId0-address2" },
        ],
      },
      {
        id: "walletId1",
        onChainAddressIdentifiers: [{ address: "walletId1-address1" }],
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
        }) as Wallet,
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
