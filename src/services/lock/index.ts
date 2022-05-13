import Redlock, { RedlockAbortSignal, ExecutionError } from "redlock"

import {
  ResourceAttemptsLockServiceError,
  ResourceExpiredLockServiceError,
  UnknownLockServiceError,
} from "@domain/lock"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import { redis } from "@services/redis"

// the maximum amount of time you want the resource locked,
// keeping in mind that you can extend the lock up until
// the point when it expires
// TODO: use TIMEOUTs env variable
const ttl = process.env.NETWORK !== "regtest" ? 180000 : 10000

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

const getWalletLockResource = (path) => `locks:wallet:${path}`
const getPaymentHashLockResource = (path) => `locks:paymenthash:${path}`
const getOnChainTxHashLockResource = (path) => `locks:onchaintxhash:${path}`

interface IRedLock {
  path: string
  signal?: RedlockAbortSignal
}

export const redlock = async ({ path, signal }: IRedLock, async_fn) => {
  if (signal) {
    if (signal.aborted) {
      return new ResourceExpiredLockServiceError(signal.error?.message)
    }
    return async_fn(signal)
  }

  try {
    return await redlockClient.using([path], ttl, async (signal) => async_fn(signal))
  } catch (error) {
    if (error instanceof ExecutionError) {
      return new ResourceAttemptsLockServiceError()
    }

    return new UnknownLockServiceError()
  }
}

export const LockService = (): ILockService => {
  const lockWalletId = async <Res>(
    { walletId }: { walletId: WalletId },
    f: (signal: WalletIdAbortSignal) => Promise<Res>,
  ): Promise<Res | LockServiceError> => {
    const path = getWalletLockResource(walletId)

    return redlock({ path }, f)
  }

  const lockPaymentHash = async <Res>(
    { paymentHash }: { paymentHash: PaymentHash },
    f: (signal: PaymentHashAbortSignal) => Promise<Res>,
  ): Promise<Res | LockServiceError> => {
    const path = getPaymentHashLockResource(paymentHash)

    return redlock({ path }, f)
  }

  const lockOnChainTxHash = async <Res>(
    { txHash }: { txHash: OnChainTxHash },
    f: (signal: OnChainTxAbortSignal) => Promise<Res>,
  ): Promise<Res | LockServiceError> => {
    const path = getOnChainTxHashLockResource(txHash)

    return redlock({ path }, f)
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
