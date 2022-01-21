import { LedgerService } from "@services/ledger"
import { btc2sat } from "@domain/bitcoin"
import { BitcoindWalletClient } from "@services/bitcoind"
import { getFunderWalletId } from "@services/ledger/accounts"

import {
  bitcoindClient,
  checkIsBalanced,
  createMandatoryUsers,
  fundLnd,
  fundWalletIdFromOnchain,
  getChainBalance,
  lnd1,
  lndOutside1,
  mineAndConfirm,
} from "test/helpers"

let bitcoindOutside

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

    const funderWalletId = await getFunderWalletId()
    await fundWalletIdFromOnchain({
      walletId: funderWalletId,
      amountInBitcoin: amount,
      lnd: lnd1,
    })

    const { chain_balance: balance } = await getChainBalance({ lnd: lnd1 })
    expect(balance).toBe(sats)

    await checkIsBalanced()

    const balanceFunderWalletId = await LedgerService().getWalletBalance(funderWalletId)
    balanceFunderWalletId
    // console.log({ balanceFunderWalletId }, "funderWalletId")
    // FIXME: this test is broken
    // checkBalance should not be true because we received fund in lnd
    // and this is not been credited by to balanceFunderWalletId
  })
})
