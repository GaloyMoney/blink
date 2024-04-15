export const sendDataToPosCompanion = ({
  username,
  amount,
  paymentHash,
  transactionId,
  date,
  time,
}: {
  username: string
  amount: string
  paymentHash?: string
  transactionId?: string
  date?: string
  time?: string
}) => {
  let deepLinkUrl = `blink-pos-companion://print?username=${encodeURIComponent(
    username,
  )}&amount=${encodeURIComponent(amount)}`

  if (paymentHash) deepLinkUrl += `&paymentHash=${encodeURIComponent(paymentHash)}`
  if (transactionId) deepLinkUrl += `&id=${encodeURIComponent(transactionId)}`
  if (date) deepLinkUrl += `&date=${encodeURIComponent(date)}`
  if (time) deepLinkUrl += `&time=${encodeURIComponent(time)}`

  console.log(deepLinkUrl)
  window.location.href = deepLinkUrl
}
