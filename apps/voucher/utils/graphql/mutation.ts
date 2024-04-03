import { gql } from "@apollo/client";

export const CREATE_WITHDRAW_LINK = gql`
  mutation CreateWithdrawLink($input: CreateWithdrawLinkInput!) {
    createWithdrawLink(input: $input) {
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
    }
  }
`;

export const UPDATE_WITHDRAW_LINK = gql`
  mutation UpdateWithdrawLink(
    $updateWithdrawLinkId: ID!
    $updateWithdrawLinkInput: UpdateWithdrawLinkInput!
  ) {
    updateWithdrawLink(
      id: $updateWithdrawLinkId
      input: $updateWithdrawLinkInput
    ) {
      account_type
      sales_amount
      created_at
      escrow_wallet
      id
      k1
      voucher_amount
      payment_hash
      payment_request
      payment_secret
      status
      title
      unique_hash
      user_id
      updated_at
      commission_percentage
    }
  }
`;

export const LN_INVOICE_CREATE = gql`
  mutation LnInvoiceCreateOnBehalfOfRecipient(
    $input: LnInvoiceCreateOnBehalfOfRecipientInput!
  ) {
    lnInvoiceCreateOnBehalfOfRecipient(input: $input) {
      errors {
        message
        path
        code
      }
      invoice {
        paymentRequest
        paymentHash
        paymentSecret
        satoshis
      }
    }
  }
`;

export const LN_INVOICE_CREATE_USD = gql`
  mutation LnUsdInvoiceCreateOnBehalfOfRecipient(
    $input: LnUsdInvoiceCreateOnBehalfOfRecipientInput!
  ) {
    lnUsdInvoiceCreateOnBehalfOfRecipient(input: $input) {
      errors {
        message
        path
        code
      }
      invoice {
        paymentRequest
        paymentHash
        paymentSecret
        satoshis
      }
    }
  }
`;

export const ON_CHAIN_PAYMENT = gql`
  mutation SendPaymentOnChain(
    $sendPaymentOnChainId: ID!
    $btcWalletAddress: String!
  ) {
    sendPaymentOnChain(
      id: $sendPaymentOnChainId
      btc_wallet_address: $btcWalletAddress
    ) {
      amount
      status
    }
  }
`;

export const DELETE_WITHDRAW_LINK = gql`
  mutation DeleteWithdrawLink($id: ID!) {
    deleteWithdrawLink(id: $id)
  }
`;
