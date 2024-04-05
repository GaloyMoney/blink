import { DomainError } from "@/domain/shared"

export class CallbackError extends DomainError {}

export class InvalidUrlError extends CallbackError {}
