import { DomainError } from "@/domain/shared"

export class MerchantError extends DomainError {}

export class InvalidMerchantIdError extends MerchantError {}
