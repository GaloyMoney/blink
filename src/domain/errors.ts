class CoreError extends Error {
  name = this.constructor.name
}

export class AuthorizationError extends CoreError {}

export class LnInvoiceDecodeError extends CoreError {}

export class LightningServiceError extends CoreError {}
export class CouldNotDecodeReturnedPaymentRequest extends LightningServiceError {}
export class UnknownLightningServiceError extends LightningServiceError {}

export class RepositoryError extends CoreError {}
export class UnknownRepositoryError extends RepositoryError {}
export class CouldNotFindError extends RepositoryError {}
