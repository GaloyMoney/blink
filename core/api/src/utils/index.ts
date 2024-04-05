import { MS_PER_DAY, MS_PER_SEC } from "@/config"
import { NonIntegerError } from "@/domain/errors"

export * as GrpcStreamClient from "./grpc-stream-client"

export async function sleep(ms: MilliSeconds | number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function timeoutWithCancel(
  delay: MilliSeconds | number,
  msg: string,
): [Promise<undefined>, () => void] {
  let timeoutId: NodeJS.Timeout | null = null
  let isCanceled = false

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
      isCanceled = true
    }
  }

  const timeoutPromise: Promise<undefined> = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      if (!isCanceled) {
        reject(new Error(msg))
      }
    }, delay)
  })

  return [timeoutPromise, cancel]
}

/**
 * Process an iterator with N workers
 * @method async
 * @param  iterator iterator to process
 * @param  processor async function that process each item
 * @param  workers  number of workers to use. 5 by default
 * @param  logger  logger instance, just needed if you want to log processor errors
 * @return       Promise with all workers
 */
export const runInParallel = <U, T extends AsyncGenerator<U>>({
  iterator,
  processor,
  logger,
  workers = 5,
}: {
  iterator: T
  processor: (arg: U, index: number) => void
  logger: Logger
  workers?: number
}) => {
  const runWorkerInParallel = async (items: T, index: number) => {
    for await (const item of items) {
      try {
        await processor(item, index)
      } catch (error) {
        logger.error({ item, error }, `issue with worker ${index}`)
      }
    }
  }
  // starts N workers sharing the same iterator, i.e. process N items in parallel
  const jobWorkers = new Array(workers).fill(iterator).map(runWorkerInParallel)
  return Promise.allSettled(jobWorkers)
}

export const mapObj = <T, R>(
  obj: T,
  fn: (arg: T[keyof T]) => R,
): { [P in keyof T]: R } => {
  const mappedObj: { [P in keyof T]: R } = {} as { [P in keyof T]: R }
  for (const key in obj) {
    mappedObj[key] = fn(obj[key])
  }
  return mappedObj
}

export const elapsedSinceTimestamp = (date: Date): Seconds => {
  return ((Date.now() - Number(date)) / 1000) as Seconds
}

export const checkedInteger = (num: number) =>
  Number.isInteger(num) ? num : new NonIntegerError()

export const timestampDaysAgo = (days: Days): Date | NonIntegerError => {
  const check = checkedInteger(days)
  return check instanceof Error ? check : new Date(Date.now() - days * MS_PER_DAY)
}

export class ModifiedSet extends Set {
  intersect<T>(otherSet: Set<T>): Set<T> {
    return new ModifiedSet(Array.from(this).filter((i) => otherSet.has(i)))
  }

  difference<T>(otherSet: Set<T>): Set<T> {
    return new ModifiedSet(Array.from(this).filter((i) => !otherSet.has(i)))
  }
}

export const delayWhile = async ({
  func,
  maxRetries,
}: {
  func: () => Promise<boolean>
  maxRetries: number
}) => {
  let res
  let count = 0
  while (!(res = await func()) && count < maxRetries) {
    count++
    await sleep(MS_PER_SEC)
  }
  return res
}
