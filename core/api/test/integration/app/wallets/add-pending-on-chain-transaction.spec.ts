import { addPendingTransaction } from "@/app/wallets"

import { WalletCurrency } from "@/domain/shared"
import * as DisplayAmountsConverterImpl from "@/domain/fiat"

import { AccountsRepository, WalletOnChainAddressesRepository } from "@/services/mongoose"
import { Wallet, WalletOnChainPendingReceive } from "@/services/mongoose/schema"
import * as PushNotificationsServiceImpl from "@/services/notifications/push-notifications"

import { createRandomUserAndWallets } from "test/helpers"
import { NotificationsService } from "@/services/notifications"

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
  it("calls sendFilteredNotification on pending onchain receive", async () => {
    // Setup mocks
    const sendFilteredNotification = jest.fn()
    jest
      .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
      .mockImplementation(() => ({
        sendFilteredNotification,
        sendNotification: jest.fn(),
      }))

    // Create user
    const { btcWalletDescriptor } = await createRandomUserAndWallets()

    const newAccount = await AccountsRepository().findById(btcWalletDescriptor.accountId)
    if (newAccount instanceof Error) throw newAccount

    // Add push device token
    const notificationSettings = await NotificationsService().addPushDeviceToken({
      userId: newAccount.kratosUserId,
      deviceToken: "123" as DeviceToken,
    })

    if (notificationSettings instanceof Error) throw notificationSettings

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
    expect(sendFilteredNotification.mock.calls.length).toBe(1)
    expect(sendFilteredNotification.mock.calls[0][0].title).toBeTruthy()
  })

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
