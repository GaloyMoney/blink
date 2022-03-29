export const AmountCalculator = () => {
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

  return {
    sub,
    add,
  }
}
