import { LightningWalletAuthed } from "./lightningImpl"

let lightningWallet

const default_uid = "abcdef" // FIXME

beforeEach(async () => {
  lightningWallet = new LightningWalletAuthed({uid: default_uid})
})

it('Lightning Wallet Get Info works', async () => {
  const result = await lightningWallet.getInfo()
  console.log({result})
  // expect(result === 0).toBeTruthy()
})

it('list transactions', async () => {
  const result = await lightningWallet.getTransactions()
  console.log({result})
  // expect(result === 0).toBeTruthy()
})

it('get balance', async () => {
  const result = await lightningWallet.getBalance()
  console.log({result})
})

it('add invoice', async () => {
  const result = await lightningWallet.addInvoice({value: 1000, memo: "tx 1"})

  console.log({result})
})