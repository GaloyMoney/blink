import { LedgerTransactionType } from "@/domain/ledger"
import {
  FAILED_USD_MEMO,
  LnPaymentState,
  LnPaymentStateDeterminator,
} from "@/domain/ledger/ln-payment-state"

const now = new Date(Date.now())
const prev = new Date(now.getTime() - 1000)

describe("LnPaymentState", () => {
  describe("Pending", () => {
    it("return Pending", () => {
      const txns = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: true,
        } as LedgerTransaction<"BTC">,
      ]
      const txState = LnPaymentStateDeterminator(txns).determine()
      expect(txState).toEqual(LnPaymentState.Pending)
    })

    it("return PendingAfterRetry", () => {
      const txns = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: true,
        } as LedgerTransaction<"BTC">,
      ]
      const txState = LnPaymentStateDeterminator(txns).determine()
      expect(txState).toEqual(LnPaymentState.PendingAfterRetry)
    })
  })

  describe("Success", () => {
    it("return Success", () => {
      const txns = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
        } as LedgerTransaction<"BTC">,
      ]
      const txState = LnPaymentStateDeterminator(txns).determine()
      expect(txState).toEqual(LnPaymentState.Success)
    })

    it("return SuccessWithReimbursement", () => {
      const txns = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.LnFeeReimbursement,
          pendingConfirmation: false,
        } as LedgerTransaction<"BTC">,
      ]
      const txState = LnPaymentStateDeterminator(txns).determine()
      expect(txState).toEqual(LnPaymentState.SuccessWithReimbursement)
    })

    it("return SuccessAfterRetry", () => {
      const txns = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: prev,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: prev,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
        } as LedgerTransaction<"BTC">,
      ]
      const txState = LnPaymentStateDeterminator(txns).determine()
      expect(txState).toEqual(LnPaymentState.SuccessAfterRetry)
    })

    it("return SuccessWithReimbursementAfterRetry", () => {
      const txns = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
          credit: 0,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.LnFeeReimbursement,
          pendingConfirmation: false,
          debit: 0,
          credit: 2,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
          debit: 0,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
          credit: 0,
        } as LedgerTransaction<"BTC">,
      ]
      const txState = LnPaymentStateDeterminator(txns).determine()
      expect(txState).toEqual(LnPaymentState.SuccessWithReimbursementAfterRetry)
    })
  })

  describe("Failed", () => {
    it("return Failed", () => {
      const txnsBtc = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
          credit: 0,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
          debit: 0,
        } as LedgerTransaction<"BTC">,
      ]
      const txBtcState = LnPaymentStateDeterminator(txnsBtc).determine()
      expect(txBtcState).toEqual(LnPaymentState.Failed)

      const txnsUsd = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 5,
          credit: 0,
        } as LedgerTransaction<"USD">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
          debit: 0,
          lnMemo: FAILED_USD_MEMO,
        } as LedgerTransaction<"BTC">,
      ]
      const txUsdState = LnPaymentStateDeterminator(txnsUsd).determine()
      expect(txUsdState).toEqual(LnPaymentState.Failed)
    })

    it("return Failed with USD", () => {
      const txnsBtc = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 2,
          credit: 0,
        } as LedgerTransaction<"USD">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
          debit: 0,
          lnMemo: FAILED_USD_MEMO,
        } as LedgerTransaction<"BTC">,
      ]
      const txBtcState = LnPaymentStateDeterminator(txnsBtc).determine()
      expect(txBtcState).toEqual(LnPaymentState.Failed)

      const txnsUsd = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 5,
          credit: 0,
        } as LedgerTransaction<"USD">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
          debit: 0,
          lnMemo: FAILED_USD_MEMO,
        } as LedgerTransaction<"BTC">,
      ]
      const txUsdState = LnPaymentStateDeterminator(txnsUsd).determine()
      expect(txUsdState).toEqual(LnPaymentState.Failed)
    })

    it("return FailedAfterRetry", () => {
      const txns = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
          credit: 0,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
          debit: 0,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
          credit: 0,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
          debit: 0,
        } as LedgerTransaction<"BTC">,
      ]
      const txState = LnPaymentStateDeterminator(txns).determine()
      expect(txState).toEqual(LnPaymentState.FailedAfterRetry)
    })

    it("return FailedAfterRetry with USD", () => {
      const txns = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
          credit: 0,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
          debit: 0,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 2,
          credit: 0,
        } as LedgerTransaction<"USD">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
          debit: 0,
          lnMemo: FAILED_USD_MEMO,
        } as LedgerTransaction<"BTC">,
      ]
      const txState = LnPaymentStateDeterminator(txns).determine()
      expect(txState).toEqual(LnPaymentState.FailedAfterRetry)
    })

    it("return FailedAfterSuccess", () => {
      const now = new Date(Date.now())
      const prev = new Date(now.getTime() - 1000)
      const txns = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: prev,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
        } as LedgerTransaction<"BTC">,
      ]

      const txState = LnPaymentStateDeterminator(txns).determine()
      expect(txState).toEqual(LnPaymentState.FailedAfterSuccess)
    })

    it("return FailedAfterSuccess with USD", () => {
      const now = new Date(Date.now())
      const prev = new Date(now.getTime() - 1000)
      const txns = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
          debit: 0,
          lnMemo: FAILED_USD_MEMO,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 2,
          credit: 0,
        } as LedgerTransaction<"USD">,
        {
          timestamp: prev,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
        } as LedgerTransaction<"BTC">,
      ]

      const txState = LnPaymentStateDeterminator(txns).determine()
      expect(txState).toEqual(LnPaymentState.FailedAfterSuccess)
    })

    it("return FailedAfterSuccessWithReimbursement", () => {
      const txns = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: prev,
          type: LedgerTransactionType.LnFeeReimbursement,
          pendingConfirmation: false,
          credit: 1,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: prev,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
        } as LedgerTransaction<"BTC">,
      ]

      const txState = LnPaymentStateDeterminator(txns).determine()
      expect(txState).toEqual(LnPaymentState.FailedAfterSuccessWithReimbursement)
    })

    it("return FailedAfterSuccessWithReimbursement with USD", () => {
      const txns = [
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
          debit: 0,
          lnMemo: FAILED_USD_MEMO,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: now,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 2,
          credit: 0,
        } as LedgerTransaction<"USD">,
        {
          timestamp: prev,
          type: LedgerTransactionType.LnFeeReimbursement,
          pendingConfirmation: false,
          credit: 1,
        } as LedgerTransaction<"BTC">,
        {
          timestamp: prev,
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
        } as LedgerTransaction<"BTC">,
      ]

      const txState = LnPaymentStateDeterminator(txns).determine()
      expect(txState).toEqual(LnPaymentState.FailedAfterSuccessWithReimbursement)
    })
  })
})
