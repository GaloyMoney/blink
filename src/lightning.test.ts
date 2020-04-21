import { LightningWalletAuthed } from "./lightningImpl"

it('Lightning Wallet Get Info works', async () => {
  const lightningWallet = new LightningWalletAuthed()
  const result = await lightningWallet.getInfo()
  console.log({result})
  // expect(result === 0).toBeTruthy()
})

