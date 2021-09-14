import { InvalidSatoshiAmount, InvalidTargetConfirmations } from "@domain/errors"

export const toSats = (amount: number): Satoshis => {
  return amount as Satoshis
}

export const checkedToSats = (amount: number): Satoshis | ValidationError => {
  if (!(amount && amount > 0)) return new InvalidSatoshiAmount()
  return amount as Satoshis
}

export const checkedToTargetConfs = (
  confs: number,
): TargetConfirmations | ValidationError => {
  if (!(confs && confs > 0)) return new InvalidTargetConfirmations()
  return confs as TargetConfirmations
}

export const BtcNetwork = {
  mainnet: "mainnet",
  testnet: "testnet",
  regtest: "regtest",
} as const
