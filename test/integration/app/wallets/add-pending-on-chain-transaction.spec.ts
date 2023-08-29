import { addPendingTransaction } from "@app/wallets"

import { WalletCurrency } from "@domain/shared"

import { WalletOnChainAddressesRepository } from "@services/mongoose"
import { Wallet, WalletOnChainPendingReceive } from "@services/mongoose/schema"
import * as PushNotificationsServiceImpl from "@services/notifications/push-notifications"

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
})

describe("addPendingTransaction", () => {
  it("calls sendNotification on pending onchain receive", async () => {
    // Setup mocks
    const sendNotification = jest.fn()
    const pushNotificationsServiceSpy = jest
      .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
      .mockImplementationOnce(() => ({ sendNotification }))

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
    expect(sendNotification.mock.calls.length).toBe(1)
    expect(sendNotification.mock.calls[0][0].title).toBeTruthy()

    // Restore system state
    pushNotificationsServiceSpy.mockRestore()
  })
})
