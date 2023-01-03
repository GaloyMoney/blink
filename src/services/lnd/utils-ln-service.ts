import lnService from "ln-service"

import { getLnds } from "./utils"

const lndsParamsAuth = getLnds({ type: "offchain", active: true })

const lnd1 = lndsParamsAuth[0].lnd
const lnd2 = lndsParamsAuth[1].lnd

async function getPendingHtlcCountLnd1(): Promise<{ [channelId: string]: number }> {
  const channels = await lnService.getChannels({ lnd1 })
  const pendingHtlcCounts: { [channelId: string]: number } = {}
  channels.forEach((channel: { id: string; pending_payments: any[] }) => {
    pendingHtlcCounts[channel.id] = channel.pending_payments.length
  })
  return pendingHtlcCounts
}

async function getPendingHtlcCountLnd2(): Promise<{ [channelId: string]: number }> {
  const channels = await lnService.getChannels({ lnd2 })
  const pendingHtlcCounts: { [channelId: string]: number } = {}
  channels.forEach((channel: { id: string; pending_payments: any[] }) => {
    pendingHtlcCounts[channel.id] = channel.pending_payments.length
  })
  return pendingHtlcCounts
}

export async function getTotalPendingHtlcCountLnd1(): Promise<number> {
  const pendingHtlcCounts = await getPendingHtlcCountLnd1()
  const totalPendingHtlcCount = Object.values(pendingHtlcCounts).reduce(
    (a, b) => a + b,
    0,
  )
  return totalPendingHtlcCount
}

export async function getTotalPendingHtlcCountLnd2(): Promise<number> {
  const pendingHtlcCounts = await getPendingHtlcCountLnd2()
  const totalPendingHtlcCount = Object.values(pendingHtlcCounts).reduce(
    (a, b) => a + b,
    0,
  )
  return totalPendingHtlcCount
}
