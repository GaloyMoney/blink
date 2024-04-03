import { gql } from "@apollo/client"

export const LN_INVOCE_PAYMENT_STATUS = gql`
  subscription LnInvoicePaymentStatus($paymentRequest: LnPaymentRequest!) {
    lnInvoicePaymentStatus(input: { paymentRequest: $paymentRequest }) {
      status
      errors {
        message
        path
        code
      }
    }
  }
`

export const REAL_TIME_WS = gql`
  subscription realtimePriceWs($currency: DisplayCurrency!) {
    realtimePrice(input: { currency: $currency }) {
      errors {
        message
      }
      realtimePrice {
        timestamp
        btcSatPrice {
          base
          offset
        }
        usdCentPrice {
          base
          offset
        }
        denominatorCurrency
      }
    }
  }
`

export const QUERY_PRICE = gql`
  subscription price(
    $amount: SatAmount!
    $amountCurrencyUnit: ExchangeCurrencyUnit!
    $priceCurrencyUnit: ExchangeCurrencyUnit!
  ) {
    price(
      input: {
        amount: $amount
        amountCurrencyUnit: $amountCurrencyUnit
        priceCurrencyUnit: $priceCurrencyUnit
      }
    ) {
      errors {
        message
      }
      price {
        base
        offset
        currencyUnit
        formattedAmount
      }
    }
  }
`
