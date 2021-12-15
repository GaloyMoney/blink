import { BitcoindWalletClient } from "@services/bitcoind"
import { btc2sat } from "@core/utils"
import { baseLogger } from "@services/logger"
import {
  lnd1,
  lndOutside1,
  bitcoindClient,
  getChainBalance,
  fundLnd,
  checkIsBalanced,
  getAndCreateUserWallet,
  mineAndConfirm,
  sendToAddressAndConfirm,
  waitUntilBlockHeight,
} from "test/helpers"
import { getWalletFromRole } from "@core/wallet-factory"
import * as Wallets from "@app/wallets"

let bitcoindOutside

beforeAll(async () => {
  // load funder wallet before use it
  await getAndCreateUserWallet(4)

  // "bankowner" user
  await getAndCreateUserWallet(14)
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

describe("Bitcoind", () => {
  it("check no wallet", async () => {
    const wallets = await bitcoindClient.listWallets()
    expect(wallets.length).toBe(0)
  })

  it("create outside wallet", async () => {
    const walletName = "outside"
    const { name } = await bitcoindClient.createWallet({ wallet_name: walletName })
    expect(name).toBe(walletName)
    const wallets = await bitcoindClient.listWallets()
    expect(wallets).toContain(walletName)
    bitcoindOutside = new BitcoindWalletClient({ walletName })
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

    // initiate the dealer wallet
    await getAndCreateUserWallet(6)

    // load funder wallet before use it
    await getAndCreateUserWallet(4)

    const funderWallet = await getWalletFromRole({ role: "funder", logger: baseLogger })
    const address = await Wallets.createOnChainAddress(funderWallet.user.walletId)
    if (address instanceof Error) throw address

    await sendToAddressAndConfirm({ walletClient: bitcoindOutside, address, amount })
    await waitUntilBlockHeight({ lnd: lnd1 })

    const { chain_balance: balance } = await getChainBalance({ lnd: lnd1 })
    expect(balance).toBe(sats)
    await checkIsBalanced()
  })
})
