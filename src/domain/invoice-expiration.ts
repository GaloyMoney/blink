import moment from "moment"

const DEFAULT_EXPIRATIONS = {
  BTC: { value: 1, unit: "days" as moment.unitOfTime.DurationConstructor },
  USD: { value: 2, unit: "minutes" as moment.unitOfTime.DurationConstructor },
}

export const invoiceExpirationForCurrency = (
  currency: TxDenominationCurrency,
  date: Date,
): InvoiceExpiration => {
  const now = moment(date)
  const delay = DEFAULT_EXPIRATIONS[currency]
  now.add(delay.value, delay.unit)
  return now.toDate() as InvoiceExpiration
}
