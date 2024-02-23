import { LedgerTransactionType } from "@/domain/ledger"
import {
  FAILED_USD_MEMO,
  LnPaymentState,
  LnPaymentStateDeterminator,
} from "@/domain/ledger/ln-payment-state"

describe("LnPaymentState", () => {
  describe("Pending", () => {
    it("return Pending", () => {
      const txns = [
        {
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
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
        } as LedgerTransaction<"BTC">,
        {
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
        } as LedgerTransaction<"BTC">,
        {
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
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
        } as LedgerTransaction<"BTC">,
        {
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
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
        } as LedgerTransaction<"BTC">,
        {
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
        } as LedgerTransaction<"BTC">,
        {
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
        } as LedgerTransaction<"BTC">,
      ]
      const txState = LnPaymentStateDeterminator(txns).determine()
      expect(txState).toEqual(LnPaymentState.SuccessAfterRetry)
    })

    it("return SuccessWithReimbursementAfterRetry", () => {
      const txns = [
        {
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
          credit: 0,
        } as LedgerTransaction<"BTC">,
        {
          type: LedgerTransactionType.LnFeeReimbursement,
          pendingConfirmation: false,
          debit: 0,
          credit: 2,
        } as LedgerTransaction<"BTC">,
        {
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
          debit: 0,
        } as LedgerTransaction<"BTC">,
        {
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
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
          credit: 0,
        } as LedgerTransaction<"BTC">,
        {
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
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 5,
          credit: 0,
        } as LedgerTransaction<"USD">,
        {
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
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 2,
          credit: 0,
        } as LedgerTransaction<"USD">,
        {
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
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 5,
          credit: 0,
        } as LedgerTransaction<"USD">,
        {
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
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
          credit: 0,
        } as LedgerTransaction<"BTC">,
        {
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
          debit: 0,
        } as LedgerTransaction<"BTC">,
        {
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
          credit: 0,
        } as LedgerTransaction<"BTC">,
        {
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
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 100,
          credit: 0,
        } as LedgerTransaction<"BTC">,
        {
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          credit: 100,
          debit: 0,
        } as LedgerTransaction<"BTC">,
        {
          type: LedgerTransactionType.Payment,
          pendingConfirmation: false,
          debit: 2,
          credit: 0,
        } as LedgerTransaction<"USD">,
        {
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
  })
})
