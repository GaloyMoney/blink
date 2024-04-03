import { env } from "@/env"
const { ESCROW_TOKEN, NEXT_PUBLIC_GALOY_URL } = env

export async function sendPaymentRequest(
  walletId: string,
  paymentRequest: string,
  memo: string,
) {
  const sendPaymentResponse = await fetch(`https://${NEXT_PUBLIC_GALOY_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ESCROW_TOKEN}`,
    },
    body: JSON.stringify({
      query: `
          mutation lnInvoicePaymentSend($walletId: WalletId!, $paymentRequest: LnPaymentRequest!, $memo: Memo) {
            lnInvoicePaymentSend(input: { walletId: $walletId, paymentRequest: $paymentRequest, memo: $memo }) {
              status
              errors {
                message
                path
                code
              }
            }
          }
        `,
      variables: {
        walletId: walletId,
        paymentRequest: paymentRequest,
        memo: memo,
      },
    }),
  })

  const { data: sendPaymentData, errors: sendPaymentErrors } =
    await sendPaymentResponse.json()

  return { data: sendPaymentData, errors: sendPaymentErrors }
}

export async function getRealtimePrice() {
  const response = await fetch(`https://${NEXT_PUBLIC_GALOY_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ESCROW_TOKEN}`,
    },
    body: JSON.stringify({
      query: `
        query RealtimePrice {
          realtimePrice {
            id
            timestamp
            denominatorCurrency
            usdCentPrice {
              base
              offset
              currencyUnit
            }
            btcSatPrice {
              base
              offset
              currencyUnit
            }
          }
        }
      `,
    }),
  })

  const { data, errors } = await response.json()
  return { data, errors }
}

export async function sendOnChainPaymentBTC(
  walletId: string,
  address: string,
  amount: number,
  memo: string,
) {
  const sendPaymentResponse = await fetch(`https://${NEXT_PUBLIC_GALOY_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ESCROW_TOKEN}`,
    },
    body: JSON.stringify({
      query: `
          mutation OnChainPaymentSend($walletId: WalletId!, $address: OnChainAddress!, $amount: SatAmount!, $memo: Memo) {
            onChainPaymentSend(input: { walletId: $walletId, address: $address, amount: $amount, memo: $memo }) {
              status
              errors {
                message
                path
                code
              }
            }
          }
        `,
      variables: {
        walletId: walletId,
        address: address,
        amount: amount,
        memo: memo,
      },
    }),
  })

  const { data: sendPaymentData, errors: sendPaymentErrors } =
    await sendPaymentResponse.json()
  return { data: sendPaymentData, errors: sendPaymentErrors }
}

export async function sendOnChainPaymentUSD(
  walletId: string,
  address: string,
  amount: number,
  memo: string,
) {
  const sendPaymentResponse = await fetch(`https://${NEXT_PUBLIC_GALOY_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ESCROW_TOKEN}`,
    },
    body: JSON.stringify({
      query: `
          mutation OnChainUsdPaymentSend($walletId: WalletId!, $address: OnChainAddress!, $amount: CentAmount!, $memo: Memo) {
            onChainUsdPaymentSend(input: { walletId: $walletId, address: $address, amount: $amount, memo: $memo }) {
              status
              errors {
                message
                path
                code
              }
            }
          }
        `,
      variables: {
        walletId: walletId,
        address: address,
        amount: amount,
        memo: memo,
      },
    }),
  })

  const { data: sendPaymentData, errors: sendPaymentErrors } =
    await sendPaymentResponse.json()

  return { data: sendPaymentData, errors: sendPaymentErrors }
}

export async function getOnChainTxFeeBTC(
  walletId: string,
  address: string,
  amount: number,
) {
  const onChainTxFeeResponse = await fetch(`https://${NEXT_PUBLIC_GALOY_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ESCROW_TOKEN}`,
    },
    body: JSON.stringify({
      query: `
          query OnChainTxFee($walletId: WalletId!, $address: OnChainAddress!, $amount: SatAmount!) {
            onChainTxFee(walletId: $walletId, address: $address, amount: $amount) {
              amount
              targetConfirmations
            }
          }
        `,
      variables: {
        walletId: walletId,
        address: address,
        amount: amount,
      },
    }),
  })

  const { data: onChainTxFeeData, errors: onChainTxFeeErrors } =
    await onChainTxFeeResponse.json()

  return { data: onChainTxFeeData, errors: onChainTxFeeErrors }
}

export async function getOnChainTxFeeUSD(
  walletId: string,
  address: string,
  amount: number,
) {
  const onChainTxFeeResponse = await fetch(`https://${NEXT_PUBLIC_GALOY_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ESCROW_TOKEN}`,
    },
    body: JSON.stringify({
      query: `
          query OnChainUsdTxFee($walletId: WalletId!, $address: OnChainAddress!, $amount:CentAmount!) {
            onChainUsdTxFee(walletId: $walletId, address: $address, amount: $amount) {
              amount
              targetConfirmations
            }
          }
        `,
      variables: {
        walletId: walletId,
        address: address,
        amount: amount,
      },
    }),
  })

  const { data: onChainTxFeeData, errors: onChainTxFeeErrors } =
    await onChainTxFeeResponse.json()

  return { data: onChainTxFeeData, errors: onChainTxFeeErrors }
}
