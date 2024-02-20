import { LedgerTransactionType } from "@/domain/ledger"
import {
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
      ]
      const txState = LnPaymentStateDeterminator(txns).determine()
      expect(txState).toEqual(LnPaymentState.Failed)
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
  })
})
