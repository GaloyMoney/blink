import { DomainError, ErrorLevel } from "@domain/shared"

export class SwapError extends DomainError {}
export class NoOutboundLiquidityForSwapError extends DomainError {}
export class SwapTriggerError extends SwapError {}
export class SwapServiceError extends SwapError {}
export class SwapClientNotResponding extends SwapServiceError {}
export class SwapErrorNoActiveLoopdNode extends SwapServiceError {}
export class SwapErrorHealthCheckFailed extends SwapServiceError {}
export class SwapErrorChannelBalanceTooLow extends SwapServiceError {}

export class UnknownSwapServiceError extends SwapServiceError {
  level = ErrorLevel.Critical
}
