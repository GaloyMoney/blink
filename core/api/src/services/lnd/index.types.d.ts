type AuthenticatedLnd = import("lightning").AuthenticatedLnd
type UnauthenticatedLnd = import("lightning").UnauthenticatedLnd

type GetFailedPaymentsArgs = import("lightning").GetFailedPaymentsArgs
type GetFailedPaymentsResult = import("lightning").GetFailedPaymentsResult
type GetPaymentsResult = import("lightning").GetPaymentsResult
type GetPaymentsArgs = import("lightning").GetPaymentsArgs
type GetPendingPaymentsArgs = import("lightning").GetPendingPaymentsArgs
type GetPendingPaymentsResult = import("lightning").GetPendingPaymentsResult

type ConfirmedPaymentResult = Extract<
  GetPaymentsResult,
  { payments: unknown }
>["payments"][0]
type PendingPaymentResult = Extract<
  GetPendingPaymentsResult,
  { payments: unknown }
>["payments"][0]
type FailedPaymentResult = Extract<
  GetFailedPaymentsResult,
  { payments: unknown }
>["payments"][0]
type PaymentResult = ConfirmedPaymentResult | PendingPaymentResult | FailedPaymentResult

type PaymentFnFactory =
  | import("lightning").AuthenticatedLightningMethod<
      GetFailedPaymentsArgs,
      GetFailedPaymentsResult
    >
  | import("lightning").AuthenticatedLightningMethod<GetPaymentsArgs, GetPaymentsResult>
  | import("lightning").AuthenticatedLightningMethod<
      GetPendingPaymentsArgs,
      GetPendingPaymentsResult
    >
