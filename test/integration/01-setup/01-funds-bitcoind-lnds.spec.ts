import { getColdStorageConfig } from "@config"
import { btc2sat } from "@domain/bitcoin"
import { BitcoindWalletClient } from "@services/bitcoind"
import { getFunderWalletId } from "@services/ledger/caching"

import {
  bitcoindClient,
  checkIsBalanced,
  createColdStorageWallet,
  createMandatoryUsers,
  fundLnd,
  fundWalletIdFromOnchain,
  getChainBalance,
  lnd1,
  lndOutside1,
  mineAndConfirm,
} from "test/helpers"

let bitcoindOutside: BitcoindWalletClient

beforeAll(async () => {
  await createMandatoryUsers()
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

describe("Bitcoind", () => {
  it("check no wallet", async () => {
    const wallets = await bitcoindClient.listWallets()
    expect(wallets.length).toBe(0)
  })

  it("create cold wallet", async () => {
    const { onChainWallet: walletName } = getColdStorageConfig()
    const { name } = await createColdStorageWallet(walletName)
    expect(name).toBe(walletName)
    const wallets = await bitcoindClient.listWallets()
    expect(wallets).toContain(walletName)
  })

  it("create outside wallet", async () => {
    const walletName = "outside"
    const { name } = await bitcoindClient.createWallet({ walletName })
    expect(name).toBe(walletName)
    const wallets = await bitcoindClient.listWallets()
    expect(wallets).toContain(walletName)
    bitcoindOutside = new BitcoindWalletClient(walletName)
  })

  it("should be funded mining 10 blocks", async () => {
    const numOfBlocks = 10
    const bitcoindAddress = await bitcoindOutside.getNewAddress()
    await mineAndConfirm({
      walletClient: bitcoindOutside,
      numOfBlocks,
      address: bitcoindAddress,
    })
    const balance = await bitcoindOutside.getBalance()
    expect(balance).toBeGreaterThanOrEqual(50 * numOfBlocks)
  })

  it("funds outside lnd node", async () => {
    const amount = 1
    const { chain_balance: initialBalance } = await getChainBalance({ lnd: lndOutside1 })
    const sats = initialBalance + btc2sat(amount)
    await fundLnd(lndOutside1, amount)
    const { chain_balance: balance } = await getChainBalance({ lnd: lndOutside1 })
    expect(balance).toBe(sats)
  })

  it("funds lnd1 node", async () => {
    const amount = 1
    const { chain_balance: initialBalance } = await getChainBalance({ lnd: lnd1 })
    const sats = initialBalance + btc2sat(amount)

    const funderWalletId = await getFunderWalletId()
    await fundWalletIdFromOnchain({
      walletId: funderWalletId,
      amountInBitcoin: amount,
      lnd: lnd1,
    })

    const { chain_balance: balance } = await getChainBalance({ lnd: lnd1 })
    expect(balance).toBe(sats)

    await checkIsBalanced()
  })
})
