import { DomainError, ErrorLevel } from "@domain/shared"

export class IbexEventError extends DomainError {}

export class IbexApiError extends IbexEventError {
    code: number // http error code
    constructor(code: number, message?: string | unknown | Error) {
        super(message)
        this.code = code
    }
}

export class NotImplementedError extends IbexEventError {
    level = ErrorLevel.Critical
}
export class IbexAuthenticationError extends IbexEventError {}
export class UnexpectedResponseError extends IbexEventError {
    level = ErrorLevel.Warn
}
