import {
  getFailedLoginAttemptPerIpLimits,
  getFailedLoginAttemptPerLoginIdentifierLimits,
  getInvoiceCreateAttemptLimits,
  getInvoiceCreateForRecipientAttemptLimits,
  getOnChainAddressCreateAttemptLimits,
  getRequestCodePerIpLimits,
  getRequestCodePerLoginIdentifierLimits,
  getRequestCodePerLoginIdentifierMinIntervalLimits,
} from "@config"

import {
  InvoiceCreateForRecipientRateLimiterExceededError,
  InvoiceCreateRateLimiterExceededError,
  OnChainAddressCreateRateLimiterExceededError,
  UserLoginIpRateLimiterExceededError,
  UserLoginPhoneRateLimiterExceededError,
  UserCodeAttemptIpRateLimiterExceededError,
  UserCodeAttemptPhoneMinIntervalRateLimiterExceededError,
  UserCodeAttemptPhoneRateLimiterExceededError,
} from "./errors"

export const RateLimitPrefix = {
  requestCodeAttemptPerLoginIdentifier: "phone_code_attempt_phone_code",
  requestCodeAttemptPerLoginIdentifierMinInterval:
    "phone_code_attempt_phone_code_min_interval",
  requestCodeAttemptPerIp: "phone_code_attempt_ip",
  failedLoginAttemptPerLoginIdentifier: "login_attempt_phone",
  failedLoginAttemptPerIp: "login_attempt_ip",
  invoiceCreate: "invoice_create",
  invoiceCreateForRecipient: "invoice_create_for_recipient",
  onChainAddressCreate: "onchain_address_create",
} as const

export const RateLimitConfig: { [key: string]: RateLimitConfig } = {
  requestCodeAttemptPerLoginIdentifier: {
    key: RateLimitPrefix.requestCodeAttemptPerLoginIdentifier,
    limits: getRequestCodePerLoginIdentifierLimits(),
    error: UserCodeAttemptPhoneRateLimiterExceededError,
  },
  requestCodeAttemptPerLoginIdentifierMinInterval: {
    key: RateLimitPrefix.requestCodeAttemptPerLoginIdentifierMinInterval,
    limits: getRequestCodePerLoginIdentifierMinIntervalLimits(),
    error: UserCodeAttemptPhoneMinIntervalRateLimiterExceededError,
  },
  requestCodeAttemptPerIp: {
    key: RateLimitPrefix.requestCodeAttemptPerIp,
    limits: getRequestCodePerIpLimits(),
    error: UserCodeAttemptIpRateLimiterExceededError,
  },
  failedLoginAttemptPerLoginIdentifier: {
    key: RateLimitPrefix.failedLoginAttemptPerLoginIdentifier,
    limits: getFailedLoginAttemptPerLoginIdentifierLimits(),
    error: UserLoginPhoneRateLimiterExceededError,
  },
  failedLoginAttemptPerIp: {
    key: RateLimitPrefix.failedLoginAttemptPerIp,
    limits: getFailedLoginAttemptPerIpLimits(),
    error: UserLoginIpRateLimiterExceededError,
  },
  invoiceCreate: {
    key: RateLimitPrefix.invoiceCreate,
    limits: getInvoiceCreateAttemptLimits(),
    error: InvoiceCreateRateLimiterExceededError,
  },
  invoiceCreateForRecipient: {
    key: RateLimitPrefix.invoiceCreateForRecipient,
    limits: getInvoiceCreateForRecipientAttemptLimits(),
    error: InvoiceCreateForRecipientRateLimiterExceededError,
  },
  onChainAddressCreate: {
    key: RateLimitPrefix.onChainAddressCreate,
    limits: getOnChainAddressCreateAttemptLimits(),
    error: OnChainAddressCreateRateLimiterExceededError,
  },
}
