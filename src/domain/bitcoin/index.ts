import { InvalidSatoshiAmount, InvalidTargetConfirmations } from "@domain/errors"

export const toSats = (amount: number): Satoshis => {
  return amount as Satoshis
}

export const toTargetConfs = (confs: number): TargetConfirmations => {
  return confs as TargetConfirmations
}

export const toMilliSats = (amount: number): MilliSatoshis => {
  return amount as MilliSatoshis
}

export const checkedToSats = (amount: number): Satoshis | ValidationError => {
  if (!(amount && amount > 0)) return new InvalidSatoshiAmount()
  return toSats(amount)
}

export const checkedToTargetConfs = (
  confs: number,
): TargetConfirmations | ValidationError => {
  if (!(confs && confs > 0)) return new InvalidTargetConfirmations()
  return toTargetConfs(confs)
}

export const BtcNetwork = {
  mainnet: "mainnet",
  testnet: "testnet",
  regtest: "regtest",
} as const
