import { checkedToPaginatedQueryCursor } from "@/domain/primitives"
import { WalletCurrency } from "@/domain/shared"
import { WalletInvoicesRepository } from "@/services/mongoose"
import { createMockWalletInvoice } from "test/helpers/wallet-invoices"

const recipientWalletDescriptor = {
  currency: WalletCurrency.Btc,
  id: crypto.randomUUID() as WalletId,
}

let createdInvoices: WalletInvoice[] = []

beforeAll(async () => {
  const walletInvoicesRepository = WalletInvoicesRepository()

  // Create 5 invoices for the same wallet
  for (let i = 0; i < 5; i++) {
    const invoice = await walletInvoicesRepository.persistNew(
      createMockWalletInvoice(recipientWalletDescriptor),
    )
    if (invoice instanceof Error) throw invoice
    createdInvoices.push(invoice)
  }

  // Sort invoices anti-chronologically
  createdInvoices = createdInvoices.sort((a, b) => {
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  // Create an invoice for a different wallet
  await walletInvoicesRepository.persistNew(
    createMockWalletInvoice({
      currency: WalletCurrency.Btc,
      id: crypto.randomUUID() as WalletId,
    }),
  )
})

describe("WalletInvoicesRepository", () => {
  describe("getInvoicesForWallet", () => {
    const walletInvoicesRepository = WalletInvoicesRepository()

    it("gets first page of invoices", async () => {
      const result = await walletInvoicesRepository.findInvoicesForWallets({
        walletIds: [recipientWalletDescriptor.id],
        paginationArgs: {
          first: 100,
        },
      })
      if (result instanceof Error) throw result

      for (let i = 0; i < createdInvoices.length; i++) {
        expect(result.edges[i]).toEqual(
          expect.objectContaining({
            cursor: createdInvoices[i].paymentHash,
            node: createdInvoices[i],
          }),
        )
      }

      expect(result.pageInfo).toEqual(
        expect.objectContaining({
          startCursor: createdInvoices[0].paymentHash,
          endCursor: createdInvoices[createdInvoices.length - 1].paymentHash,
          hasPreviousPage: false,
          hasNextPage: false,
        }),
      )
    })

    it("gets page after cursor", async () => {
      const result = await walletInvoicesRepository.findInvoicesForWallets({
        walletIds: [recipientWalletDescriptor.id],
        paginationArgs: {
          first: 2,
          after: checkedToPaginatedQueryCursor(createdInvoices[1].paymentHash),
        },
      })
      if (result instanceof Error) throw result

      expect(result.edges[0]).toEqual(
        expect.objectContaining({
          cursor: createdInvoices[2].paymentHash,
          node: createdInvoices[2],
        }),
      )
      expect(result.edges[1]).toEqual(
        expect.objectContaining({
          cursor: createdInvoices[3].paymentHash,
          node: createdInvoices[3],
        }),
      )

      expect(result.pageInfo).toEqual(
        expect.objectContaining({
          startCursor: createdInvoices[2].paymentHash,
          endCursor: createdInvoices[3].paymentHash,
          hasNextPage: true,
        }),
      )
    })

    it("get last page of invoices", async () => {
      const result = await walletInvoicesRepository.findInvoicesForWallets({
        walletIds: [recipientWalletDescriptor.id],
        paginationArgs: {
          last: 100,
        },
      })
      if (result instanceof Error) throw result

      for (let i = 0; i < createdInvoices.length; i++) {
        expect(result.edges[i]).toEqual(
          expect.objectContaining({
            cursor: createdInvoices[i].paymentHash,
            node: createdInvoices[i],
          }),
        )
      }
    })

    it("get page before cursor", async () => {
      const result = await walletInvoicesRepository.findInvoicesForWallets({
        walletIds: [recipientWalletDescriptor.id],
        paginationArgs: {
          last: 2,
          before: checkedToPaginatedQueryCursor(
            createdInvoices[createdInvoices.length - 2].paymentHash,
          ),
        },
      })
      if (result instanceof Error) throw result

      expect(result.edges[0]).toEqual(
        expect.objectContaining({
          cursor: createdInvoices[createdInvoices.length - 4].paymentHash,
          node: createdInvoices[createdInvoices.length - 4],
        }),
      )
      expect(result.edges[1]).toEqual(
        expect.objectContaining({
          cursor: createdInvoices[createdInvoices.length - 3].paymentHash,
          node: createdInvoices[createdInvoices.length - 3],
        }),
      )

      expect(result.pageInfo).toEqual(
        expect.objectContaining({
          startCursor: createdInvoices[createdInvoices.length - 4].paymentHash,
          endCursor: createdInvoices[createdInvoices.length - 3].paymentHash,
          hasPreviousPage: true,
        }),
      )
    })

    it("returns empty edges for wallet without invoices", async () => {
      const result = await walletInvoicesRepository.findInvoicesForWallets({
        walletIds: [crypto.randomUUID() as WalletId],
        paginationArgs: {
          first: 100,
        },
      })
      if (result instanceof Error) throw result

      expect(result).toEqual(
        expect.objectContaining({
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
          },
        }),
      )
    })
  })
})
