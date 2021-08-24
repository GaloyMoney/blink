import { InvalidSatoshiAmount } from "@domain/errors"

export const toSats = (amount: number): Satoshis => {
  return amount as Satoshis
}

export const checkedToSats = (amount: number): Satoshis | ValidationError => {
  if (!(amount && amount > 0)) return new InvalidSatoshiAmount()
  return amount as Satoshis
}

export const toMSats = (amount: number): MSatoshis => {
  return (amount * 1000) as MSatoshis
}

export const BtcNetwork = {
  mainnet: "mainnet",
  testnet: "testnet",
  regtest: "regtest",
} as const
