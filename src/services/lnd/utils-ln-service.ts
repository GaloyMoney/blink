import lnService from "ln-service"

import { getLnds } from "./utils"

const lndsParamsAuth = getLnds({ type: "offchain", active: true })

const lnd1 = lndsParamsAuth[0].lnd
const lnd2 = lndsParamsAuth[1].lnd

interface Channel {
  pending_payments: number[]
}

async function getPendingPaymentCountLnd1(): Promise<number> {
  const channels = await lnService.getChannels({ lnd1 })
  const pendingPayments = channels.filter(
    (channel: Channel) => channel.pending_payments.length > 0,
  )
  return pendingPayments.length
}

async function getPendingPaymentCountLnd2(): Promise<number> {
  const channels = await lnService.getChannels({ lnd2 })
  const pendingPayments = channels.filter(
    (channel: Channel) => channel.pending_payments.length > 0,
  )
  return pendingPayments.length
}

export async function getPendingPaymentCount(): Promise<number> {
  const pendingPaymentCountLnd1 = await getPendingPaymentCountLnd1()
  const pendingPaymentCountLnd2 = await getPendingPaymentCountLnd2()
  const pendingPaymentCount = pendingPaymentCountLnd1 + pendingPaymentCountLnd2
  return pendingPaymentCount
}
