export const AmountCalculator = (): AmountCalculator => {
  const add = <T extends WalletCurrency>(a: PaymentAmount<T>, b: PaymentAmount<T>) => {
    return {
      currency: a.currency,
      amount: a.amount + b.amount,
    }
  }

  const sub = <T extends WalletCurrency>(a: PaymentAmount<T>, b: PaymentAmount<T>) => {
    return {
      currency: a.currency,
      amount: a.amount - b.amount,
    }
  }

  const div = <T extends WalletCurrency>(
    a: PaymentAmount<T>,
    b: bigint,
  ): PaymentAmount<T> => {
    const quotient = a.amount / b

    const roundDownBound = b / 2n
    const mod = a.amount % b
    return mod > roundDownBound
      ? { amount: quotient + 1n, currency: a.currency }
      : { amount: quotient, currency: a.currency }
  }

  return {
    sub,
    add,
    div,
  }
}
