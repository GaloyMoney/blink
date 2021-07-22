import { btc2sat } from "src/utils"
import { baseLogger } from "src/logger"
import { getFunderWallet } from "src/walletFactory"
import {
  lnd1,
  lndOutside1,
  bitcoindClient, // default = coinless
  bitcoindOutside,
  getChainBalance,
  fundLnd,
  checkIsBalanced,
  getUserWallet,
  mineAndConfirm,
  sendToAddressAndConfirm,
  waitUntilBlockHeight,
} from "test/helpers"

jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))
jest.mock("src/phone-provider", () => require("test/mocks/phone-provider"))

beforeAll(async () => {
  // load funder wallet before use it
  await getUserWallet(4)

  // "bankowner" user
  await getUserWallet(14)
})

describe("Bitcoind", () => {
  it("check no wallet", async () => {
    const wallets = await bitcoindClient.listWallets()
    expect(wallets.length).toBe(0)
  })

  it("create default wallet", async () => {
    await createWalletInClient("default")
  })

  // TODO: at the moment the "hot" wallet is only used here, specifically for a further test (specter-wallet) which considers the number of wallets...
  it("create hot wallet", async () => {
    await createWalletInClient("hot")
  })

  it("create outside wallet", async () => {
    await createWalletInClient("outside")
  })

  it("should be funded mining 10 blocks", async () => {
    const numOfBlock = 10
    const bitcoindAddress = await bitcoindOutside.getNewAddress()
    await mineAndConfirm(bitcoindOutside, numOfBlock, bitcoindAddress)
    const balance = await bitcoindOutside.getBalance()
    expect(balance).toBeGreaterThanOrEqual(50 * numOfBlock)
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

    // load funder wallet before use it
    await getUserWallet(4)
    const funderWallet = await getFunderWallet({ logger: baseLogger })
    const address = await funderWallet.getOnChainAddress()

    await sendToAddressAndConfirm(bitcoindOutside, address, amount)
    await waitUntilBlockHeight({ lnd: lnd1 })

    const { chain_balance: balance } = await getChainBalance({ lnd: lnd1 })
    expect(balance).toBe(sats)
    await checkIsBalanced()
  })
})

async function createWalletInClient(walletName) {
  const { name } = await bitcoindClient.createWallet(walletName)
  expect(name).toBe(walletName)
  const wallets = await bitcoindClient.listWallets()
  expect(wallets).toContain(walletName)
}
