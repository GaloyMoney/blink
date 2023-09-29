import { BigIntFloatConversionError, UnknownBigIntConversionError } from "./errors"

export const safeBigInt = (num: number): bigint | BigIntConversionError => {
  try {
    return BigInt(num)
  } catch (err) {
    if (err instanceof RangeError) {
      return new BigIntFloatConversionError(`${num}`)
    }
    return new UnknownBigIntConversionError(err)
  }
}
