import { gql } from "@apollo/client";

export const GET_WITHDRAW_LINK = gql`
  query GetWithdrawLink($getWithdrawLinkId: ID) {
    getWithdrawLink(id: $getWithdrawLinkId) {
      id
      user_id
      payment_request
      payment_hash
      payment_secret
      sales_amount
      account_type
      escrow_wallet
      status
      title
      voucher_amount
      unique_hash
      k1
      created_at
      updated_at
      commission_percentage
      identifier_code
      secret_code
      invoice_expiration
    }
  }
`;

export const GET_WITHDRAW_LINKS_BY_USER_ID = gql`
  query GetWithdrawLinksByUserId(
    $userId: ID!
    $status: Status
    $limit: Int
    $offset: Int
  ) {
    getWithdrawLinksByUserId(
      user_id: $userId
      status: $status
      limit: $limit
      offset: $offset
    ) {
      total_links
      withdrawLinks {
        id
        user_id
        payment_request
        payment_hash
        payment_secret
        sales_amount
        account_type
        escrow_wallet
        status
        title
        voucher_amount
        unique_hash
        k1
        created_at
        updated_at
        commission_percentage
        identifier_code
        secret_code
        invoice_expiration
      }
    }
  }
`;

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
`;

export const GET_REAL_TIME_PRICE = gql`
  query realtimePriceInitial($currency: DisplayCurrency!) {
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
`;

export const GET_ON_CHAIN_PAYMENT_FEES = gql`
  query GetOnChainPaymentFees(
    $getOnChainPaymentFeesId: ID!
    $btcWalletAddress: String!
  ) {
    getOnChainPaymentFees(
      id: $getOnChainPaymentFeesId
      btc_wallet_address: $btcWalletAddress
    ) {
      fees
    }
  }
`;

export const GET_WITHDRAW_LINK_BY_VOUCHER_CODE = gql`
  query GetWithdrawLinkBySecret($secret_code: String!) {
    getWithdrawLink(secret_code: $secret_code) {
      id
    }
  }
`;