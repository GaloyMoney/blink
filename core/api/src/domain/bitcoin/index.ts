import {
  InvalidCurrencyBaseAmountError,
  InvalidSatoshiAmountError,
} from "@/domain/errors"
import { MAX_SATS, BtcAmountTooLargeError } from "@/domain/shared"

export const SATS_PER_BTC = 10 ** 8

export const btc2sat = (btc: number) => {
  return Math.round(btc * SATS_PER_BTC) as Satoshis
}

export const sat2btc = (sat: number) => {
  return sat / SATS_PER_BTC
}

export const toSats = (amount: number | bigint): Satoshis => {
  return Number(amount) as Satoshis
}

export const toMilliSatsFromNumber = (amount: number): MilliSatoshis => {
  return amount as MilliSatoshis
}

export const toMilliSatsFromString = (amount: string): MilliSatoshis => {
  return parseInt(amount, 10) as MilliSatoshis
}

export const checkedToCurrencyBaseAmount = (
  amount: number,
): CurrencyBaseAmount | ValidationError => {
  if (!(amount && amount > 0)) return new InvalidCurrencyBaseAmountError()
  return amount as CurrencyBaseAmount
}

export const checkedToSats = (amount: number): Satoshis | ValidationError => {
  if (!(amount && amount > 0)) {
    return new InvalidSatoshiAmountError(`${amount}`)
  }

  if (amount > MAX_SATS.amount) {
    return new BtcAmountTooLargeError()
  }

  return toSats(amount)
}

// Check for hexadecimal (case insensitive) 64-char SHA-256 hash
export const isSha256Hash = (value: string): boolean => !!value.match(/^[a-f0-9]{64}$/i)

export const BtcNetwork = {
  mainnet: "mainnet",
  testnet: "testnet",
  signet: "signet",
  regtest: "regtest",
} as const

// Offchain routing fees are capped at 0.5%
export const FEECAP_BASIS_POINTS = 50n // 100 basis points == 1%
export const FEEMIN = toSats(10) // sats
