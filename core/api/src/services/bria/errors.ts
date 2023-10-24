import { DomainError, ErrorLevel } from "@/domain/shared"

export class BriaEventError extends DomainError {}
export class EventAugmentationMissingError extends BriaEventError {
  level = ErrorLevel.Critical
}

export class BriaPayloadError extends BriaEventError {
  level = ErrorLevel.Critical
}
export class NoPayloadFoundError extends BriaPayloadError {}
export class ExpectedUtxoDetectedPayloadNotFoundError extends BriaPayloadError {}
export class ExpectedUtxoDroppedPayloadNotFoundError extends BriaPayloadError {}
export class ExpectedUtxoSettledPayloadNotFoundError extends BriaPayloadError {}
export class ExpectedPayoutSubmittedPayloadNotFoundError extends BriaPayloadError {}
export class ExpectedPayoutCommittedPayloadNotFoundError extends BriaPayloadError {}
export class ExpectedPayoutBroadcastPayloadNotFoundError extends BriaPayloadError {}
export class ExpectedPayoutSettledPayloadNotFoundError extends BriaPayloadError {}
export class ExpectedPayoutCancelledPayloadNotFoundError extends BriaPayloadError {}
export class UnknownPayloadTypeReceivedError extends BriaPayloadError {}
export class ExpectedAddressInfoMissingInEventError extends BriaPayloadError {}

export class UnknownBriaEventError extends BriaEventError {
  level = ErrorLevel.Critical
}
