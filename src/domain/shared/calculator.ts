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

export const AmountMathWrapper = <T extends WalletCurrency>(base: PaymentAmount<T>) => {
  const add = (valueToAdd: PaymentAmount<T>) => {
    return AmountMathWrapper(AmountCalculator().add(base, valueToAdd))
  }

  const sub = (valueToSub: PaymentAmount<T>) => {
    return AmountMathWrapper(AmountCalculator().sub(base, valueToSub))
  }

  const lessThan = (valueCompared: PaymentAmount<T>) => {
    return base.amount < valueCompared.amount
  }

  const value = base

  return {
    add,
    sub,
    lessThan,
    value,
  }
}
