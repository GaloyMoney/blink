import {
  getFailedLoginAttemptPerIpLimits,
  getFailedLoginAttemptPerPhoneLimits,
  getInvoiceCreateAttemptLimits,
  getInvoiceCreateForRecipientAttemptLimits,
  getOnChainAddressCreateAttemptLimits,
  getRequestPhoneCodePerIpLimits,
  getRequestPhoneCodePerPhoneLimits,
  getRequestPhoneCodePerPhoneMinIntervalLimits,
} from "@config"

import {
  InvoiceCreateForRecipientRateLimiterExceededError,
  InvoiceCreateRateLimiterExceededError,
  OnChainAddressCreateRateLimiterExceededError,
  UserLoginIpRateLimiterExceededError,
  UserLoginPhoneRateLimiterExceededError,
  UserPhoneCodeAttemptIpRateLimiterExceededError,
  UserPhoneCodeAttemptPhoneMinIntervalRateLimiterExceededError,
  UserPhoneCodeAttemptPhoneRateLimiterExceededError,
} from "./errors"

export const RateLimitPrefix = {
  requestPhoneCodeAttemptPerPhone: "phone_code_attempt_phone_code",
  requestPhoneCodeAttemptPerPhoneMinInterval:
    "phone_code_attempt_phone_code_min_interval",
  requestPhoneCodeAttemptPerIp: "phone_code_attempt_ip",
  failedLoginAttemptPerPhone: "login_attempt_phone",
  failedLoginAttemptPerEmailAddress: "login_attempt_email",
  failedLoginAttemptPerIp: "login_attempt_ip",
  invoiceCreate: "invoice_create",
  invoiceCreateForRecipient: "invoice_create_for_recipient",
  onChainAddressCreate: "onchain_address_create",
} as const

export const RateLimitConfig: { [key: string]: RateLimitConfig } = {
  requestPhoneCodeAttemptPerPhone: {
    key: RateLimitPrefix.requestPhoneCodeAttemptPerPhone,
    limits: getRequestPhoneCodePerPhoneLimits(),
    error: UserPhoneCodeAttemptPhoneRateLimiterExceededError,
  },
  requestPhoneCodeAttemptPerPhoneMinInterval: {
    key: RateLimitPrefix.requestPhoneCodeAttemptPerPhoneMinInterval,
    limits: getRequestPhoneCodePerPhoneMinIntervalLimits(),
    error: UserPhoneCodeAttemptPhoneMinIntervalRateLimiterExceededError,
  },
  requestPhoneCodeAttemptPerIp: {
    key: RateLimitPrefix.requestPhoneCodeAttemptPerIp,
    limits: getRequestPhoneCodePerIpLimits(),
    error: UserPhoneCodeAttemptIpRateLimiterExceededError,
  },
  failedLoginAttemptPerPhone: {
    key: RateLimitPrefix.failedLoginAttemptPerPhone,
    limits: getFailedLoginAttemptPerPhoneLimits(),
    error: UserLoginPhoneRateLimiterExceededError,
  },
  failedLoginAttemptPerEmailAddress: {
    key: RateLimitPrefix.failedLoginAttemptPerEmailAddress,
    limits: getFailedLoginAttemptPerPhoneLimits(),
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
