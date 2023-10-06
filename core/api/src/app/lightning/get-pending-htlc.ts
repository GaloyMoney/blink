import { ErrorLevel } from "@/domain/shared"

import { LndService } from "@/services/lnd"
import { recordExceptionInCurrentSpan } from "@/services/tracing"

export const getTotalPendingHtlcCount = async (): Promise<number | ApplicationError> => {
  const offChainService = LndService()
  if (offChainService instanceof Error) return offChainService

  const pendingHtlcCount = await Promise.all(
    offChainService
      .listActivePubkeys()
      .map((pubkey) => offChainService.getTotalPendingHtlcCount(pubkey)),
  )

  return sumPendingHtlc(pendingHtlcCount)
}

export const getIncomingPendingHtlcCount = async (): Promise<
  number | ApplicationError
> => {
  const offChainService = LndService()
  if (offChainService instanceof Error) return offChainService

  const pendingHtlcCount = await Promise.all(
    offChainService
      .listActivePubkeys()
      .map((pubkey) => offChainService.getIncomingPendingHtlcCount(pubkey)),
  )

  return sumPendingHtlc(pendingHtlcCount)
}

export const getOutgoingPendingHtlcCount = async (): Promise<
  number | ApplicationError
> => {
  const offChainService = LndService()
  if (offChainService instanceof Error) return offChainService

  const pendingHtlcCount = await Promise.all(
    offChainService
      .listActivePubkeys()
      .map((pubkey) => offChainService.getOutgoingPendingHtlcCount(pubkey)),
  )

  return sumPendingHtlc(pendingHtlcCount)
}

const sumPendingHtlc = (pendingHtlc: (number | Error)[]): number => {
  const total = pendingHtlc.reduce((total: number, c) => {
    if (c instanceof Error) {
      recordExceptionInCurrentSpan({ error: c, level: ErrorLevel.Critical })
      return total
    }
    return total + c
  }, 0)

  return total
}
