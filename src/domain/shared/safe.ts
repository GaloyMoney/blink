import { BigIntFloatConversionError, UnknownBigIntConversionError } from "./errors"

export const safeBigInt = (num: number): bigint | BigIntConversionError => {
  try {
    return BigInt(num)
  } catch (err) {
    if (err instanceof RangeError) {
      return new BigIntFloatConversionError(`${num}`)
    }
    if (err instanceof Error) {
      return new UnknownBigIntConversionError(err.message)
    }
    if (typeof err === "string") {
      return new UnknownBigIntConversionError(err)
    }
    return new UnknownBigIntConversionError()
  }
}
