import { InvalidSatoshiAmount, InvalidTargetConfirmations } from "@domain/errors"

export const toSats = (amount: number): Satoshis => {
  return amount as Satoshis
}

export const toTargetConfs = (confs: number): TargetConfirmations => {
  return confs as TargetConfirmations
}

export const toMilliSatsFromNumber = (amount: number): MilliSatoshis => {
  return amount as MilliSatoshis
}

export const toMilliSatsFromString = (amount: string): MilliSatoshis => {
  return parseInt(amount, 10) as MilliSatoshis
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

export const FEECAP = toSats(0.02) // = 2%
export const FEEMIN = toSats(10) // sats
