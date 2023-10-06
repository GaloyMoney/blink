import { btc2sat, sat2btc } from "@/domain/bitcoin"
import { getFunderWalletId } from "@/services/ledger/caching"

import {
  bitcoindClient,
  bitcoindSignerClient,
  checkIsBalanced,
  createMandatoryUsers,
  createSignerWallet,
  fundLnd,
  fundWalletIdFromOnchain,
  getChainBalance,
  lnd1,
  lndOutside1,
  mineAndConfirm,
} from "test/helpers"
import { BitcoindWalletClient } from "test/helpers/bitcoind"

let bitcoindOutside: BitcoindWalletClient

beforeAll(async () => {
  await createMandatoryUsers()
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

afterEach(async () => {
  await checkIsBalanced()
})

describe("Bitcoind", () => {
  it("check no wallet", async () => {
    const wallets = await bitcoindClient.listWallets()
    expect(wallets.length).toBe(0)
  })

  it("create signer wallet for bria", async () => {
    const walletName = "dev"
    const { name } = await createSignerWallet(walletName)
    expect(name).toBe(walletName)

    const wallets = await bitcoindSignerClient.listWallets()
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
    const outsideLnds = [lndOutside1]
    for (const lnd of outsideLnds) {
      const amount = btc2sat(1)
      const { chain_balance: initialBalance } = await getChainBalance({
        lnd,
      })
      const sats = initialBalance + amount
      await fundLnd(lnd, sat2btc(amount))
      const { chain_balance: balance } = await getChainBalance({ lnd })
      expect(balance).toBe(sats)
    }
  })

  it("funds lnd1 node", async () => {
    const amount = btc2sat(1)
    const { chain_balance: initialBalance } = await getChainBalance({ lnd: lnd1 })
    const sats = initialBalance + amount

    const funderWalletId = await getFunderWalletId()
    await fundWalletIdFromOnchain({
      walletId: funderWalletId,
      amountInBitcoin: sat2btc(amount),
      lnd: lnd1,
    })

    const { chain_balance: balance } = await getChainBalance({ lnd: lnd1 })
    expect(balance).toBe(sats)
  })
})
