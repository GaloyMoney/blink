import { InvalidSatoshiAmount } from "@domain/errors"

export const toSats = (amount: number): Satoshis => {
  return amount as Satoshis
}

export const toMilliSats = (amount: number): MilliSatoshis => {
  return amount as MilliSatoshis
}

export const checkedToSats = (amount: number): Satoshis | ValidationError => {
  if (!(amount && amount > 0)) return new InvalidSatoshiAmount()
  return amount as Satoshis
}

export const BtcNetwork = {
  mainnet: "mainnet",
  testnet: "testnet",
  regtest: "regtest",
} as const
