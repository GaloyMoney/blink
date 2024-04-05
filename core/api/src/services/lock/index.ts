import Redlock, { ExecutionError } from "redlock"

import { NETWORK } from "@/config"

import {
  ResourceAttemptsRedlockServiceError,
  ResourceAttemptsTimelockServiceError,
  ResourceExpiredLockServiceError,
  UnknownLockServiceError,
} from "@/domain/lock"
import { parseErrorMessageFromUnknown } from "@/domain/shared"

import { redis } from "@/services/redis"
import { wrapAsyncFunctionsToRunInSpan } from "@/services/tracing"

const durationLockIdempotencyKey = (1000 * 60 * 60) as MilliSeconds // 1 hour

// the maximum amount of time you want the resource to initially be locked,
// note: with redlock 5, the lock is automatically extended
const ttl = () => (NETWORK !== "regtest" ? 180000 : 10000)

const retryCount = NETWORK !== "regtest" ? 10 : 3
const retryDelay = NETWORK !== "regtest" ? 600 : 400 // time in ms

const redlockClient = new Redlock(
  // you should have one client for each independent redis node
  // or cluster
  [redis],
  {
    // the expected clock drift; for more details
    // see http://redis.io/topics/distlock
    driftFactor: 0.01, // time in ms

    // the max number of times Redlock will attempt
    // to lock a resource before erroring
    retryCount,

    // the time in ms between attempts
    retryDelay,

    // the max time in ms randomly added to retries
    // to improve performance under high contention
    // see https://www.awsarchitectureblog.com/2015/03/backoff.html
    retryJitter: 200, // time in ms

    // The minimum remaining time on a lock before an extension is automatically
    // attempted with the `using` API.
    automaticExtensionThreshold: 2500, // time in ms
  },
)

const timelockClient = new Redlock(
  // you should have one client for each independent redis node
  // or cluster
  [redis],
  {
    // the expected clock drift; for more details
    // see http://redis.io/topics/distlock
    driftFactor: 0.01, // time in ms

    // the max number of times Redlock will attempt
    // to lock a resource before erroring
    retryCount: 1,
  },
)

const getWalletLockResource = (path: WalletId) => `locks:wallet:${path}`
const getPaymentHashLockResource = (path: PaymentHash) => `locks:paymenthash:${path}`
const getOnChainTxHashLockResource = (path: OnChainTxHash) =>
  `locks:onchaintxhash:${path}`
const getOnChainTxHashAndVoutLockResource = ({
  txHash,
  vout,
}: {
  txHash: OnChainTxHash
  vout: OnChainTxVout
}) => `locks:onchaintxhash:${txHash}:${vout}`
const getIdempotencyKeyLockResource = (path: IdempotencyKey) =>
  `locks:idempotencykey:${path}`

// unlock after asyncFn is done
export const redlock = async <Signal extends RedlockAbortSignal, Ret>({
  path,
  signal,
  asyncFn,
}: RedlockArgs<Signal, Ret>): Promise<Ret | LockServiceError> => {
  if (signal) {
    if (signal.aborted) {
      return new ResourceExpiredLockServiceError(signal.error?.message)
    }
    return asyncFn(signal)
  }

  try {
    return await redlockClient.using([path], ttl(), async (signal) =>
      asyncFn(signal as Signal),
    )
  } catch (error) {
    if (error instanceof ExecutionError) {
      return new ResourceAttemptsRedlockServiceError()
    }

    return new UnknownLockServiceError(parseErrorMessageFromUnknown(error))
  }
}

// for use case when:
// - we want to abort if the lock is not acquired
// - we only want the lock to be released after the TTL expires
export const timelock = async ({
  resource,
  duration,
}: {
  resource: string
  duration: MilliSeconds
}) => {
  return timelockClient.acquire([resource], duration)
}

export const LockService = (): ILockService => {
  const lockWalletId = async <Res>(
    walletId: WalletId,
    asyncFn: (signal: WalletIdAbortSignal) => Promise<Res>,
  ): Promise<Res | LockServiceError> => {
    const path = getWalletLockResource(walletId)

    return redlock({ path, asyncFn })
  }

  const lockPaymentHash = async <Res>(
    paymentHash: PaymentHash,
    asyncFn: (signal: PaymentHashAbortSignal) => Promise<Res>,
  ): Promise<Res | LockServiceError> => {
    const path = getPaymentHashLockResource(paymentHash)

    return redlock({ path, asyncFn })
  }

  const lockOnChainTxHash = async <Res>(
    txHash: OnChainTxHash,
    asyncFn: (signal: OnChainTxAbortSignal) => Promise<Res>,
  ): Promise<Res | LockServiceError> => {
    const path = getOnChainTxHashLockResource(txHash)

    return redlock({ path, asyncFn })
  }

  const lockOnChainTxHashAndVout = async <Res>(
    { txHash, vout }: { txHash: OnChainTxHash; vout: OnChainTxVout },
    asyncFn: (signal: OnChainTxAbortSignal) => Promise<Res>,
  ): Promise<Res | LockServiceError> => {
    const path = getOnChainTxHashAndVoutLockResource({ txHash, vout })

    return redlock({ path, asyncFn })
  }

  const lockIdempotencyKey = async (
    idempotencyKey: IdempotencyKey,
  ): Promise<void | LockServiceError> => {
    const path = getIdempotencyKeyLockResource(idempotencyKey)

    try {
      await timelock({ resource: path, duration: durationLockIdempotencyKey })
    } catch (err) {
      if (err instanceof ExecutionError) {
        return new ResourceAttemptsTimelockServiceError()
      }

      return new UnknownLockServiceError(err)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.lock",
    fns: {
      lockWalletId,
      lockPaymentHash,
      lockOnChainTxHash,
      lockOnChainTxHashAndVout,
      lockIdempotencyKey,
    },
  })
}
