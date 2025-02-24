import DistributedLock from "@ndustrial/node-distributed-lock"

import { knex } from "@/services/db/knex"

const getVoucherSecretLockResource = (secret: string) => `locks:voucher:secret:${secret}`
const getVoucherK1LockResource = (k1: string) => `locks:voucher:k1:${k1}`

const lock = async <Res>(
  path: string,
  asyncFn: () => Promise<Res>,
): Promise<Res | Error> => {
  try {
    let result: Res | undefined

    const lock = new DistributedLock(path, { queryInterface: knex })
    await lock.lock(async () => {
      result = await asyncFn()
    })

    if (result === undefined) {
      return new Error("Lock execution failed without a result")
    }

    return result
  } catch (error) {
    if (error instanceof Error) {
      return error
    }
    return new Error(`${error}`)
  }
}

export const lockVoucherSecret = async <Res>(
  voucherSecret: string,
  asyncFn: () => Promise<Res>,
): Promise<Res | Error> => {
  const path = getVoucherSecretLockResource(voucherSecret)
  return lock(path, asyncFn)
}

export const lockVoucherK1 = async <Res>(
  k1: string,
  asyncFn: () => Promise<Res>,
): Promise<Res | Error> => {
  const path = getVoucherK1LockResource(k1)
  return lock(path, asyncFn)
}
