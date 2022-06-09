import Redlock, { ExecutionError } from "redlock"

import {
  ResourceAttemptsLockServiceError,
  ResourceExpiredLockServiceError,
  UnknownLockServiceError,
} from "@domain/lock"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import { redis } from "@services/redis"
import { BTC_NETWORK } from "@config"

// the maximum amount of time you want the resource to initially be locked,
// note: with redlock 5, the lock is automatically extended
const ttl = BTC_NETWORK !== "regtest" ? 180000 : 10000

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
    retryCount: 3,

    // the time in ms between attempts
    retryDelay: 400, // time in ms

    // the max time in ms randomly added to retries
    // to improve performance under high contention
    // see https://www.awsarchitectureblog.com/2015/03/backoff.html
    retryJitter: 200, // time in ms

    // The minimum remaining time on a lock before an extension is automatically
    // attempted with the `using` API.
    automaticExtensionThreshold: 2500, // time in ms
  },
)

const getWalletLockResource = (path: WalletId) => `locks:wallet:${path}`
const getPaymentHashLockResource = (path: PaymentHash) => `locks:paymenthash:${path}`
const getOnChainTxHashLockResource = (path: OnChainTxHash) =>
  `locks:onchaintxhash:${path}`

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
    return await redlockClient.using([path], ttl, async (signal) =>
      asyncFn(signal as Signal),
    )
  } catch (error) {
    if (error instanceof ExecutionError) {
      return new ResourceAttemptsLockServiceError()
    }

    return new UnknownLockServiceError()
  }
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

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.lock",
    fns: {
      lockWalletId,
      lockPaymentHash,
      lockOnChainTxHash,
    },
  })
}
