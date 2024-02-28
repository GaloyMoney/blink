import { addPendingTransaction } from "@/app/wallets"

import { WalletCurrency } from "@/domain/shared"
import * as DisplayAmountsConverterImpl from "@/domain/fiat"

import { WalletOnChainAddressesRepository } from "@/services/mongoose"
import { Wallet, WalletOnChainPendingReceive } from "@/services/mongoose/schema"

import { createRandomUserAndWallets } from "test/helpers"

const address = "bcrt1qs758ursh4q9z627kt3pp5yysm78ddny6txaqgw" as OnChainAddress

const btcAmount = { amount: 100_000n, currency: WalletCurrency.Btc }

afterEach(async () => {
  await WalletOnChainPendingReceive.deleteMany({})
  await Wallet.updateMany(
    {},
    { $pull: { onchain: { address } } },
    { multi: true }, // This option updates all matching documents
  )

  jest.restoreAllMocks()
})

describe("addPendingTransaction", () => {
  it("calls DisplayConverter on pending onchain receive", async () => {
    // Setup mocks
    const displayAmountsConverterSpy = jest.spyOn(
      DisplayAmountsConverterImpl,
      "DisplayAmountsConverter",
    )

    // Create user
    const { btcWalletDescriptor } = await createRandomUserAndWallets()

    // Add address to user wallet
    await WalletOnChainAddressesRepository().persistNew({
      walletId: btcWalletDescriptor.id,
      onChainAddress: { address },
    })

    // Add pending transaction
    await addPendingTransaction({
      txId: "txId" as OnChainTxHash,
      vout: 0 as OnChainTxVout,
      satoshis: btcAmount,
      address,
    })

    // Expect sent notification
    expect(displayAmountsConverterSpy).toHaveBeenCalledTimes(1)
  })
})
