import { createOnChainAddressForBtcWallet } from "@app/wallets"
import { WalletCurrency } from "@domain/shared"
import { WalletOnChainPendingReceiveRepository } from "@services/mongoose"
import { sleep, timeoutWithCancel } from "@utils"

import {
  RANDOM_ADDRESS,
  addNewWallet,
  bitcoindOutside,
  defaultStateConfig,
  getBalanceHelper,
  initializeTestingState,
  killServer,
  randomAccount,
  startServer,
} from "test/helpers"

let serverPid: PID

beforeAll(async () => {
  await initializeTestingState(defaultStateConfig())

  serverPid = await startServer("start-trigger-ci")
})

afterAll(async () => {
  await killServer(serverPid)
})

describe("trigger", () => {
  describe("Bria listener", () => {
    it("receives a payment", async () => {
      const satsAmount = 0.00_010_000
      const [timeoutPromise, cancelTimeout] = timeoutWithCancel(45_000, "Timeout")

      // Get new address from bria
      const wallet = await addNewWallet({
        accountId: (await randomAccount()).id,
        currency: WalletCurrency.Btc,
      })
      if (wallet instanceof Error) throw wallet
      const bitcoindAddress = await createOnChainAddressForBtcWallet({
        walletId: wallet.id,
      })
      if (bitcoindAddress instanceof Error) throw bitcoindAddress

      // Test UtxoDetected event handled
      await bitcoindOutside.sendToAddress({
        address: bitcoindAddress,
        amount: satsAmount,
      })

      const addressPromise = waitForAddress({
        fn: WalletOnChainPendingReceiveRepository().listByWalletIdsAndAddresses,
        args: {
          walletIds: [wallet.id],
          addresses: [bitcoindAddress],
        },
      })
      const result = await Promise.race([addressPromise, timeoutPromise])
      if (result instanceof Error) throw result
      const initBalance = await getBalanceHelper(wallet.id)
      expect(initBalance).toEqual(0)

      // Test UtxoSettled event handled
      await bitcoindOutside.generateToAddress({
        nblocks: 3,
        address: RANDOM_ADDRESS,
      })

      const addressNotPresentPromise = waitForNoAddress({
        fn: WalletOnChainPendingReceiveRepository().listByWalletIdsAndAddresses,
        args: {
          walletIds: [wallet.id],
          addresses: [bitcoindAddress],
        },
      })
      await Promise.race([addressNotPresentPromise, timeoutPromise])
      cancelTimeout()

      const finalBalance = await getBalanceHelper(wallet.id)
      expect(finalBalance).toBeGreaterThan(0)
    })
  })
})

type waitForAddressArgs = {
  fn: (
    ListWalletOnChainPendingReceiveByAddressesArgs,
  ) => Promise<WalletOnChainSettledTransaction[] | Error>
  args: ListWalletOnChainPendingReceiveByAddressesArgs
}

const waitForAddress = async ({
  fn,
  args,
}: waitForAddressArgs): Promise<WalletOnChainSettledTransaction[]> => {
  return new Promise<WalletOnChainSettledTransaction[]>(async (resolve) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await fn(args)

      if (!(result instanceof Error)) {
        resolve(result)
        break
      }

      await sleep(1000)
    }
  })
}

const waitForNoAddress = async ({ fn, args }: waitForAddressArgs): Promise<true> => {
  return new Promise<true>(async (resolve) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await fn(args)

      if (result instanceof Error) {
        resolve(true)
        break
      }

      await sleep(1000)
    }
  })
}
