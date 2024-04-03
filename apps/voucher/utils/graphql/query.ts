import { gql } from "@apollo/client"

export const GET_WITHDRAW_LINK = gql`
  query GetWithdrawLink($getWithdrawLinkId: ID) {
    getWithdrawLink(id: $getWithdrawLinkId) {
      id
      userId
      paymentRequest
      paymentHash
      paymentSecret
      salesAmount
      accountType
      escrowWallet
      status
      title
      voucherAmount
      uniqueHash
      k1
      createdAt
      updatedAt
      commissionPercentage
      identifierCode
      secretCode
      invoiceExpiration
    }
  }
`

export const GET_WITHDRAW_LINKS_BY_USER_ID = gql`
  query GetWithdrawLinksByUserId(
    $userId: ID!
    $status: Status
    $limit: Int
    $offset: Int
  ) {
    getWithdrawLinksByUserId(
      userId: $userId
      status: $status
      limit: $limit
      offset: $offset
    ) {
      totalLinks
      withdrawLinks {
        id
        userId
        paymentRequest
        paymentHash
        paymentSecret
        salesAmount
        accountType
        escrowWallet
        status
        title
        voucherAmount
        uniqueHash
        k1
        createdAt
        updatedAt
        commissionPercentage
        identifierCode
        secretCode
        invoiceExpiration
      }
    }
  }
`

export const GET_CURRENCY_LIST = gql`
  query CurrencyList {
    currencyList {
      id
      symbol
      name
      flag
      fractionDigits
    }
  }
`

export const GET_REAL_TIME_PRICE = gql`
  query RealtimePriceInitial($currency: DisplayCurrency!) {
    realtimePrice(currency: $currency) {
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
`

export const GET_ON_CHAIN_PAYMENT_FEES = gql`
  query GetOnChainPaymentFees($getOnChainPaymentFeesId: ID!, $btcWalletAddress: String!) {
    getOnChainPaymentFees(
      id: $getOnChainPaymentFeesId
      btcWalletAddress: $btcWalletAddress
    ) {
      fees
    }
  }
`

export const GET_WITHDRAW_LINK_BY_VOUCHER_CODE = gql`
  query GetWithdrawLinkBySecret($secretCode: String!) {
    getWithdrawLink(secretCode: $secretCode) {
      id
    }
  }
`
