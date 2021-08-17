export const toSats = (amount: number): Satoshis => {
  return amount as Satoshis
}

export const BtcNetwork = {
  mainnet: "mainnet",
  testnet: "testnet",
  regtest: "regtest",
} as const
