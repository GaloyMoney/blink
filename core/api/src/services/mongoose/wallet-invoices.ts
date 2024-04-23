import { WalletInvoice } from "./schema"

import { parseRepositoryError } from "./utils"

import { decodeInvoice } from "@/domain/bitcoin/lightning"

import {
  CouldNotFindWalletInvoiceError,
  RepositoryError,
  UnknownRepositoryError,
  WalletInvoiceMissingLnInvoiceError,
} from "@/domain/errors"
import { checkedToPaginatedQueryCursor } from "@/domain/primitives"
import { UsdPaymentAmount } from "@/domain/shared"

type InvoiceFilters = {
  walletIds: WalletId[]
}

type InvoicesQueryFilter = {
  walletId: {
    $in: WalletId[]
  }
  paymentRequest: {
    $exists: true
  }
  timestamp?: {
    $lt?: Date
    $gt?: Date
  }
  externalId?: {
    $regex: string
  }
}

const paginatedInvoices = async ({
  filters,
  paginationArgs,
}: {
  filters: InvoiceFilters
  paginationArgs: PaginatedQueryArgs
}): Promise<PaginatedQueryResult<WalletInvoice> | RepositoryError> => {
  const filterQuery: InvoicesQueryFilter = {
    walletId: { $in: filters.walletIds },
    paymentRequest: { $exists: true },
  }

  const { first, last, before, after } = paginationArgs

  const beforeInvoicePromise = before && WalletInvoice.findOne({ _id: before })
  const afterInvoicePromise = after && WalletInvoice.findOne({ _id: after })
  const [beforeInvoice, afterInvoice] = await Promise.all([
    beforeInvoicePromise,
    afterInvoicePromise,
  ])

  // this could cause a bug if there are multiple invoices with the same timestamp
  const beforeDate = beforeInvoice ? beforeInvoice.timestamp : undefined
  const afterDate = afterInvoice ? afterInvoice.timestamp : undefined

  if (beforeDate || afterDate) {
    filterQuery["timestamp"] = {}

    if (beforeDate) {
      filterQuery.timestamp.$gt = beforeDate
    }
    if (afterDate) {
      filterQuery.timestamp.$lt = afterDate
    }
  }

  const documentCount = await WalletInvoice.countDocuments(filterQuery)

  // hasPreviousPage and hasNextPage can default to false for the opposite pagination direction per the Connection spec
  let hasPreviousPage = false
  let hasNextPage = false
  let walletInvoiceRecords: WalletInvoiceRecord[]

  if (first !== undefined) {
    walletInvoiceRecords = await WalletInvoice.collection
      .find<WalletInvoiceRecord>(filterQuery)
      .sort({ timestamp: -1, _id: -1 })
      .limit(first)
      .toArray()
    if (documentCount > first) {
      hasNextPage = true
    }
  } else {
    let skipAmount = 0
    if (documentCount > last) {
      hasPreviousPage = true
      skipAmount = documentCount - last
    }

    walletInvoiceRecords = await WalletInvoice.collection
      .find<WalletInvoiceRecord>(filterQuery)
      .sort({ timestamp: -1, _id: 1 })
      .skip(skipAmount)
      .toArray()
  }

  const maybeWalletInvoices = walletInvoiceRecords
    .map(walletInvoiceFromRaw)
    .map(ensureWalletInvoiceHasLnInvoice)
  const walletInvoices: WalletInvoice[] = []
  for (const maybeInvoice of maybeWalletInvoices) {
    if (maybeInvoice instanceof Error) return maybeInvoice
    walletInvoices.push(maybeInvoice)
  }

  return {
    edges: walletInvoices.map((walletInvoice) => ({
      cursor: checkedToPaginatedQueryCursor(walletInvoice.paymentHash),
      node: walletInvoice,
    })),
    pageInfo: {
      startCursor: walletInvoices[0]?.paymentHash
        ? checkedToPaginatedQueryCursor(walletInvoices[0].paymentHash)
        : undefined,
      endCursor: walletInvoices[walletInvoices.length - 1]?.paymentHash
        ? checkedToPaginatedQueryCursor(
            walletInvoices[walletInvoices.length - 1].paymentHash,
          )
        : undefined,
      hasPreviousPage,
      hasNextPage,
    },
  }
}

export const WalletInvoicesRepository = (): IWalletInvoicesRepository => {
  const persistNew = async ({
    paymentHash,
    secret,
    recipientWalletDescriptor,
    selfGenerated,
    pubkey,
    paid,
    usdAmount,
    externalId,
    lnInvoice,
  }: WalletInvoicesPersistNewArgs): Promise<WalletInvoice | RepositoryError> => {
    try {
      const walletInvoice = await new WalletInvoice({
        _id: paymentHash,
        secret,
        walletId: recipientWalletDescriptor.id,
        accountId: recipientWalletDescriptor.accountId,
        selfGenerated,
        pubkey,
        paid,
        cents: usdAmount ? Number(usdAmount.amount) : undefined,
        currency: recipientWalletDescriptor.currency,
        paymentRequest: lnInvoice.paymentRequest,
        externalId,
      }).save()
      return ensureWalletInvoiceHasLnInvoice(walletInvoiceFromRaw(walletInvoice))
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const markAsPaid = async (
    paymentHash: PaymentHash,
  ): Promise<WalletInvoiceWithOptionalLnInvoice | RepositoryError> => {
    try {
      const walletInvoice = await WalletInvoice.findOneAndUpdate(
        { _id: paymentHash },
        { paid: true, processingCompleted: true },
        {
          new: true,
        },
      )
      if (!walletInvoice) {
        return new CouldNotFindWalletInvoiceError()
      }
      return walletInvoiceFromRaw(walletInvoice)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const markAsProcessingCompleted = async (
    paymentHash: PaymentHash,
  ): Promise<WalletInvoiceWithOptionalLnInvoice | RepositoryError> => {
    try {
      const walletInvoice = await WalletInvoice.findOneAndUpdate(
        { _id: paymentHash },
        { processingCompleted: true },
        {
          new: true,
        },
      )
      if (!walletInvoice) {
        return new CouldNotFindWalletInvoiceError()
      }
      return walletInvoiceFromRaw(walletInvoice)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findByPaymentHash = async (
    paymentHash: PaymentHash,
  ): Promise<WalletInvoice | RepositoryError> => {
    try {
      const walletInvoice = await WalletInvoice.findOne({ _id: paymentHash })
      if (!walletInvoice) {
        return new CouldNotFindWalletInvoiceError(paymentHash)
      }
      return ensureWalletInvoiceHasLnInvoice(walletInvoiceFromRaw(walletInvoice))
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findForWalletByPaymentHash = async ({
    walletId,
    paymentHash,
  }: WalletInvoiceFindForWalletByPaymentHashArgs): Promise<
    WalletInvoice | RepositoryError
  > => {
    try {
      const walletInvoice = await WalletInvoice.findOne({ _id: paymentHash, walletId })
      if (!walletInvoice) {
        return new CouldNotFindWalletInvoiceError(paymentHash)
      }
      return ensureWalletInvoiceHasLnInvoice(walletInvoiceFromRaw(walletInvoice))
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  async function* yieldPending():
    | AsyncGenerator<WalletInvoiceWithOptionalLnInvoice>
    | RepositoryError {
    let pending
    try {
      pending = WalletInvoice.find({
        paid: false,
        processingCompleted: false,
      }).cursor({
        batchSize: 100,
      })
    } catch (error) {
      return new UnknownRepositoryError(error)
    }

    for await (const walletInvoice of pending) {
      yield walletInvoiceFromRaw(walletInvoice)
    }
  }

  const findInvoicesForWallets = async ({
    walletIds,
    paginationArgs,
  }: {
    walletIds: WalletId[]
    paginationArgs: PaginatedQueryArgs
  }): Promise<PaginatedQueryResult<WalletInvoice> | RepositoryError> => {
    try {
      const invoicesResp = await paginatedInvoices({
        filters: {
          walletIds,
        },
        paginationArgs,
      })

      return invoicesResp
    } catch (error) {
      return new UnknownRepositoryError(error)
    }
  }

  return {
    persistNew,
    markAsPaid,
    markAsProcessingCompleted,
    findByPaymentHash,
    findForWalletByPaymentHash,
    yieldPending,
    findInvoicesForWallets,
  }
}

const walletInvoiceFromRaw = (
  result: WalletInvoiceRecord,
): WalletInvoiceWithOptionalLnInvoice => {
  const lnInvoice = result.paymentRequest
    ? decodeInvoice(result.paymentRequest)
    : undefined

  if (lnInvoice instanceof Error) throw new Error("Corrupt payment request in db")

  return {
    paymentHash: result._id as PaymentHash,
    secret: result.secret as SecretPreImage,
    recipientWalletDescriptor: {
      id: result.walletId as WalletId,
      currency: result.currency as WalletCurrency,
      accountId: result.accountId as AccountId,
    },
    selfGenerated: result.selfGenerated,
    pubkey: result.pubkey as Pubkey,
    paid: result.paid as boolean,
    usdAmount: result.cents ? UsdPaymentAmount(BigInt(result.cents)) : undefined,
    createdAt: new Date(result.timestamp.getTime()),
    processingCompleted: result.processingCompleted,
    externalId: result.externalId as LedgerExternalId,
    lnInvoice,
  }
}

const ensureWalletInvoiceHasLnInvoice = (
  walletInvoiceWithOptionalLnInvoice: WalletInvoiceWithOptionalLnInvoice,
) => {
  if (!walletInvoiceWithOptionalLnInvoice.lnInvoice) {
    return new WalletInvoiceMissingLnInvoiceError()
  }

  return walletInvoiceWithOptionalLnInvoice as WalletInvoice
}
