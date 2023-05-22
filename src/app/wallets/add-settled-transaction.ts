export const addSettledTransaction = async ({
  txId: txHash,
  vout,
  satoshis: amount,
  address,
}: {
  txId: OnChainTxHash
  vout: OnChainTxVout
  satoshis: BtcPaymentAmount
  address: OnChainAddress
}): Promise<true | ApplicationError> => {
  txHash
  vout
  amount
  address

  return true
}
