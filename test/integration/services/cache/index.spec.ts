import { createHash, randomBytes } from "crypto"

import { SECS_PER_10_MINS } from "@config"

import { toSats } from "@domain/bitcoin"
import { uniqueAddressesForTxn } from "@domain/bitcoin/onchain"

import { RedisCacheService } from "@services/cache"

const randomString = (length) => {
  const sha256 = (buffer: Buffer) => createHash("sha256").update(buffer).digest("hex")
  return sha256(randomBytes(32)).slice(0, length)
}

const redis = RedisCacheService()

const nonCacheCounts = {
  getOrSet: 0,
}

const incomingTxns: IncomingOnChainTransaction[] = [
  {
    confirmations: 0,
    rawTx: {
      txHash: "txHash1" as OnChainTxHash,
      outs: [
        {
          address: "walletId0-address1" as OnChainAddress,
          sats: toSats(100),
        },
        {
          sats: toSats(200),
          address: "change-address1" as OnChainAddress,
        },
      ],
    },
    fee: toSats(0),
    createdAt: new Date(Date.now()),
    uniqueAddresses: () => [] as OnChainAddress[],
  },
]

const getOnChainTxs = async (key): Promise<IncomingOnChainTransaction[]> =>
  redis.getOrSet({
    key,
    ttlSecs: SECS_PER_10_MINS,
    getForCaching: async (): Promise<IncomingOnChainTransaction[]> => {
      nonCacheCounts.getOrSet++
      return incomingTxns
    },
    inflate: async (txnsPromise: Promise<IncomingOnChainTransactionFromCache[]>) =>
      (await txnsPromise).map(inflateIncomingOnChainTxFromCache),
  })

const inflateIncomingOnChainTxFromCache = (
  txn: IncomingOnChainTransactionFromCache | IncomingOnChainTransaction,
): IncomingOnChainTransaction => ({
  ...txn,
  createdAt: new Date(txn.createdAt),
  uniqueAddresses: () => uniqueAddressesForTxn(txn.rawTx),
})

describe("Redis Cache", () => {
  it("getOrSet", async () => {
    const key = `bitcoin:${randomString(8)}`

    expect(nonCacheCounts.getOrSet).toEqual(0)

    const txns1 = await getOnChainTxs(key)
    expect(nonCacheCounts.getOrSet).toEqual(1)
    expect(txns1).toStrictEqual(incomingTxns)

    const txns2 = await getOnChainTxs(key)
    expect(nonCacheCounts.getOrSet).toEqual(1)
    // Non-stringify 'txns2' returns "Received: serializes to the same string"
    expect(JSON.stringify(txns2)).toStrictEqual(JSON.stringify(incomingTxns))

    const newKey = `bitcoin:${randomString(8)}`
    const txns3 = await getOnChainTxs(newKey)
    expect(nonCacheCounts.getOrSet).toEqual(2)
    expect(txns3).toStrictEqual(incomingTxns)

    const txns4 = await getOnChainTxs(key)
    expect(nonCacheCounts.getOrSet).toEqual(2)
    // Non-stringify 'txns4' returns "Received: serializes to the same string"
    expect(JSON.stringify(txns4)).toStrictEqual(JSON.stringify(incomingTxns))
  })
})
