import { DomainError } from "@/domain/shared"

export class CallbackError extends DomainError {}

export class CallbackServiceError extends CallbackError {}

export class InvalidUrlError extends CallbackServiceError {}
