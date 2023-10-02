import { addSettledTransaction } from "@app/wallets"

import { WalletCurrency } from "@domain/shared"
import { Transaction, TransactionMetadata } from "@services/ledger/schema"

import { WalletOnChainAddressesRepository } from "@services/mongoose"
import { Wallet } from "@services/mongoose/schema"
import * as PushNotificationsServiceImpl from "@services/notifications/push-notifications"

import { createMandatoryUsers, createRandomUserAndWallets } from "test/helpers"

const address = "bcrt1qs758ursh4q9z627kt3pp5yysm78ddny6txaqgw" as OnChainAddress

const btcAmount = { amount: 100_000n, currency: WalletCurrency.Btc }

beforeAll(async () => {
  await createMandatoryUsers()
})

afterEach(async () => {
  await Transaction.deleteMany({})
  await TransactionMetadata.deleteMany({})
  await Wallet.updateMany(
    {},
    { $pull: { onchain: { address } } },
    { multi: true }, // This option updates all matching documents
  )
})

describe("addSettledTransaction", () => {
  it("calls sendFilteredNotification on successful onchain receive", async () => {
    // Setup mocks
    const sendFilteredNotification = jest.fn()
    const pushNotificationsServiceSpy = jest
      .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
      .mockImplementationOnce(() => ({
        sendFilteredNotification,
        sendNotification: jest.fn(),
      }))

    // Create user
    const { btcWalletDescriptor } = await createRandomUserAndWallets()

    // Add address to user wallet
    await WalletOnChainAddressesRepository().persistNew({
      walletId: btcWalletDescriptor.id,
      onChainAddress: { address },
    })

    // Add settled transaction
    await addSettledTransaction({
      txId: "txId" as OnChainTxHash,
      vout: 0 as OnChainTxVout,
      satoshis: btcAmount,
      address,
    })

    // Expect sent notification
    expect(sendFilteredNotification.mock.calls.length).toBe(1)
    expect(sendFilteredNotification.mock.calls[0][0].title).toBeTruthy()

    // Restore system state
    pushNotificationsServiceSpy.mockRestore()
  })
})
