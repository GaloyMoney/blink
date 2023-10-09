import { DomainError } from "@/domain/shared"

export class AccountError extends DomainError {}

export class UsernameNotAvailableError extends AccountError {}
export class UsernameIsImmutableError extends AccountError {}

export class InvalidAccountError extends AccountError {}
export class InvalidAccountIdError extends AccountError {}
export class InvalidWalletForAccountError extends AccountError {}
