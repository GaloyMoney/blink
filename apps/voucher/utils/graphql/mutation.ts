import { gql } from "@apollo/client"

export const CREATE_WITHDRAW_LINK = gql`
  mutation CreateWithdrawLink($input: CreateWithdrawLinkInput!) {
    createWithdrawLink(input: $input) {
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
    }
  }
`

export const UPDATE_WITHDRAW_LINK = gql`
  mutation UpdateWithdrawLink(
    $updateWithdrawLinkId: ID!
    $updateWithdrawLinkInput: UpdateWithdrawLinkInput!
  ) {
    updateWithdrawLink(id: $updateWithdrawLinkId, input: $updateWithdrawLinkInput) {
      accountType
      salesAmount
      createdAt
      escrowWallet
      id
      k1
      voucherAmount
      paymentHash
      paymentRequest
      paymentSecret
      status
      title
      uniqueHash
      userId
      updatedAt
      commissionPercentage
    }
  }
`

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
`

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
`

export const ON_CHAIN_PAYMENT = gql`
  mutation SendPaymentOnChain($sendPaymentOnChainId: ID!, $btcWalletAddress: String!) {
    sendPaymentOnChain(id: $sendPaymentOnChainId, btcWalletAddress: $btcWalletAddress) {
      amount
      status
    }
  }
`

export const DELETE_WITHDRAW_LINK = gql`
  mutation DeleteWithdrawLink($id: ID!) {
    deleteWithdrawLink(id: $id)
  }
`
