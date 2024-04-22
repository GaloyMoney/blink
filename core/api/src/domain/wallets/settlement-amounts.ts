import { toSats } from "@/domain/bitcoin"
import {
  getCurrencyMajorExponent,
  displayAmountFromNumber,
  toCents,
  UsdDisplayCurrency,
} from "@/domain/fiat"
import { ErrorLevel, WalletCurrency } from "@/domain/shared"

import { recordExceptionInCurrentSpan } from "@/services/tracing"

export const SettlementAmounts = () => {
  const fromTxn = <S extends WalletCurrency>(
    txn: LedgerTransaction<S>,
  ): {
    settlementAmount: Satoshis | UsdCents
    settlementDisplayAmount: DisplayCurrencyMajorAmount
    settlementDisplayFee: DisplayCurrencyMajorAmount
  } => {
    // ======
    // Calculate: settlementAmount
    // ======

    const { debit, credit, currency, displayCurrency: displayCurrencyRaw } = txn
    const displayCurrency = displayCurrencyRaw || UsdDisplayCurrency
    const settlementAmount =
      currency === WalletCurrency.Btc ? toSats(credit - debit) : toCents(credit - debit)

    // ======
    // Calculate: settlementDisplayAmount
    // ======

    // Setup settlementDisplayAmount calc
    const {
      satsAmount: satsAmountRaw,
      satsFee: satsFeeRaw,
      centsAmount: centsAmountRaw,
      centsFee: centsFeeRaw,
      displayAmount: displayAmountRaw,
      displayFee: displayFeeRaw,
    } = txn

    const satsAmount = satsAmountRaw || toSats(0)
    const satsFee = satsFeeRaw || toSats(0)
    const centsAmount = centsAmountRaw || toCents(0)
    const centsFee = centsFeeRaw || toCents(0)
    const displayAmount = displayAmountRaw || (0 as DisplayCurrencyBaseAmount)
    const displayFee = displayFeeRaw || (0 as DisplayCurrencyBaseAmount)

    const amount = {
      sats: satsAmount,
      cents: centsAmount,
      display: displayAmount,
    }
    const negAmount = {
      sats: toSats(-satsAmount),
      cents: toCents(-centsAmount),
      display: -displayAmount as DisplayCurrencyBaseAmount,
    }
    const fee = {
      sats: satsFee,
      cents: centsFee,
      display: displayFee,
    }
    const negFee = {
      sats: toSats(-satsFee),
      cents: toCents(-centsFee),
      display: -displayFee as DisplayCurrencyBaseAmount,
    }
    const zero = {
      sats: 0 as Satoshis,
      cents: 0 as UsdCents,
      display: 0 as DisplayCurrencyBaseAmount,
    }

    const combinations: {
      sats: Satoshis
      cents: UsdCents
      display: DisplayCurrencyBaseAmount
    }[][] = [
      [amount, zero],
      [negAmount, zero],
      [zero, fee],
      [zero, negFee],
      [amount, fee],
      [negAmount, negFee],
      [amount, negFee],
      [negAmount, fee],
    ]

    // Match settlementDisplayAmount calc to settlementAmount
    let matchIndex = -1
    for (const [i, [amount, fee]] of combinations.entries()) {
      const unit = currency === WalletCurrency.Btc ? "sats" : "cents"
      if (amount[unit] + fee[unit] === settlementAmount) {
        matchIndex = i
        break
      }
    }

    // Calculate settlementDisplayAmount with matched combination
    let settlementDisplayAmountMinorAsNumber = 0
    if (matchIndex >= 0) {
      const [amountToUse, feeToUse] = combinations[matchIndex]
      settlementDisplayAmountMinorAsNumber = amountToUse.display + feeToUse.display
    }

    const exponent = getCurrencyMajorExponent(displayCurrency)

    let settlementDisplayAmountObj = displayAmountFromNumber({
      amount: settlementDisplayAmountMinorAsNumber,
      currency: displayCurrency,
    })
    if (settlementDisplayAmountObj instanceof Error) {
      recordExceptionInCurrentSpan({
        error: settlementDisplayAmountObj,
        level: ErrorLevel.Critical,
      })
      settlementDisplayAmountObj = {
        amountInMinor: 0n,
        currency: displayCurrency,
        displayInMajor: (0).toFixed(exponent),
      }
    }

    let settlementDisplayFeeObj = displayAmountFromNumber({
      amount: displayFee,
      currency: displayCurrency,
    })
    if (settlementDisplayFeeObj instanceof Error) {
      recordExceptionInCurrentSpan({
        error: settlementDisplayFeeObj,
        level: ErrorLevel.Critical,
      })
      settlementDisplayFeeObj = {
        amountInMinor: 0n,
        currency: displayCurrency,
        displayInMajor: (0).toFixed(exponent),
      }
    }

    return {
      settlementAmount,
      settlementDisplayAmount: settlementDisplayAmountObj.displayInMajor,
      settlementDisplayFee: settlementDisplayFeeObj.displayInMajor,
    }
  }

  return {
    fromTxn,
  }
}
