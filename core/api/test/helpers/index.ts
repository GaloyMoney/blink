import { ExecutionResult, graphql, Source } from "graphql"

import { ObjMap } from "graphql/jsutils/ObjMap"

import { randomUserId } from "./random"

import { gqlAdminSchema } from "@/graphql/admin"

import { AccountsRepository } from "@/services/mongoose"
import { getCurrencyMajorExponent, priceAmountFromNumber } from "@/domain/fiat"
import { DepositFeeCalculator } from "@/domain/wallets"
import { AmountCalculator } from "@/domain/shared"

export * from "./bitcoin-core"
export * from "./bria"
export * from "./check-is-balanced"
export * from "./get-error"
export * from "./generate-hash"
export * from "./ledger"
export * from "./lightning"
export * from "./price"
export * from "./random"
export * from "./rate-limit"
export * from "./redis"
export * from "./shared"
export * from "./user"
export * from "./wallet"

const calc = AmountCalculator()

// TODO: use same function as createUserAndWallet
export const randomAccount = async () => {
  const account = await AccountsRepository().persistNew(randomUserId())
  if (account instanceof Error) throw account
  return account
}

export const amountAfterFeeDeduction = ({
  amount,
  minBankFee,
  minBankFeeThreshold,
  depositFeeRatio,
}: {
  amount: BtcPaymentAmount
  minBankFee: BtcPaymentAmount
  minBankFeeThreshold: BtcPaymentAmount
  depositFeeRatio: DepositFeeRatioAsBasisPoints
}) => {
  const satsFee = DepositFeeCalculator().onChainDepositFee({
    amount,
    minBankFee,
    minBankFeeThreshold,
    ratio: depositFeeRatio,
  })
  if (satsFee instanceof Error) throw satsFee

  return Number(calc.sub(amount, satsFee).amount)
}

export const resetDatabase = async (mongoose: typeof import("mongoose")) => {
  const db = mongoose.connection.db
  // Get all collections
  const collections = await db.listCollections().toArray()
  // Create an array of collection names and drop each collection
  const collectionNames = collections.map((c) => c.name)
  for (const collectionName of collectionNames) {
    await db.dropCollection(collectionName)
  }
}

export const amountByPriceAsMajor = <
  S extends WalletCurrency,
  T extends DisplayCurrency,
>({
  amount,
  price,
  walletCurrency,
  displayCurrency,
}: {
  amount: Satoshis | UsdCents
  price: WalletMinorUnitDisplayPrice<S, T> | undefined
  walletCurrency: S
  displayCurrency: T
}): number => {
  const priceAmount =
    price === undefined
      ? priceAmountFromNumber({
          priceOfOneSatInMinorUnit: 0,
          displayCurrency,
          walletCurrency,
        })
      : price

  const exponent = getCurrencyMajorExponent(displayCurrency)
  return (
    (amount * Number(priceAmount.base)) / 10 ** (Number(priceAmount.offset) + exponent)
  )
}

export const graphqlAdmin = async <
  T = Promise<ExecutionResult<ObjMap<unknown>, ObjMap<unknown>>>,
>({
  source,
  contextValue,
}: {
  source: string | Source
  contextValue?: Partial<GraphQLAdminContext>
}) => graphql({ schema: gqlAdminSchema, source, contextValue }) as unknown as T
