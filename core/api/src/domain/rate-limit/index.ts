import {
  InvoiceCreateForRecipientRateLimiterExceededError,
  InvoiceCreateRateLimiterExceededError,
  OnChainAddressCreateRateLimiterExceededError,
  UserLoginIpRateLimiterExceededError,
  UserLoginIdentifierRateLimiterExceededError,
  UserCodeAttemptIpRateLimiterExceededError,
  UserCodeAttemptIdentifierRateLimiterExceededError,
  DeviceAccountCreateRateLimiterExceededError,
  UserCodeAttemptAppcheckJtiLimiterExceededError,
  AddQuizAttemptIpRateLimiterExceededError,
  AddQuizAttemptPhoneRateLimiterExceededError,
} from "./errors"

import {
  getDeviceAccountCreateAttemptLimits,
  getFailedLoginAttemptPerIpLimits,
  getLoginAttemptPerLoginIdentifierLimits,
  getInvoiceCreateAttemptLimits,
  getInvoiceCreateForRecipientAttemptLimits,
  getOnChainAddressCreateAttemptLimits,
  getRequestCodePerIpLimits,
  getRequestCodePerLoginIdentifierLimits,
  getAppcheckJtiAttemptLimits,
  getAddQuizPerIpLimits,
  getAddQuizPerPhoneLimits,
} from "@/config"

export const RateLimitPrefix = {
  requestCodeAttemptPerLoginIdentifier: "request_code_attempt_id",
  requestCodeAttemptPerIp: "request_code_attempt_ip",
  loginAttemptPerLoginIdentifier: "login_attempt_id",
  failedLoginAttemptPerIp: "login_attempt_ip",
  invoiceCreate: "invoice_create",
  invoiceCreateForRecipient: "invoice_create_for_recipient",
  onChainAddressCreate: "onchain_address_create",
  deviceAccountCreate: "device_account_create",
  requestCodeAttemptPerAppcheckJti: "request_code_attempt_appcheck_jti",
  addQuizAttemptPerIp: "add_quiz_attempt_ip",
  addQuizAttemptPerPhone: "add_quiz_attempt_phone",
} as const

type RateLimitPrefixKey = keyof typeof RateLimitPrefix

export const RateLimitConfig: { [key in RateLimitPrefixKey]: RateLimitConfig } = {
  requestCodeAttemptPerLoginIdentifier: {
    key: RateLimitPrefix.requestCodeAttemptPerLoginIdentifier,
    limits: getRequestCodePerLoginIdentifierLimits(),
    error: UserCodeAttemptIdentifierRateLimiterExceededError,
  },
  requestCodeAttemptPerIp: {
    key: RateLimitPrefix.requestCodeAttemptPerIp,
    limits: getRequestCodePerIpLimits(),
    error: UserCodeAttemptIpRateLimiterExceededError,
  },
  loginAttemptPerLoginIdentifier: {
    key: RateLimitPrefix.loginAttemptPerLoginIdentifier,
    limits: getLoginAttemptPerLoginIdentifierLimits(),
    error: UserLoginIdentifierRateLimiterExceededError,
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
  deviceAccountCreate: {
    key: RateLimitPrefix.deviceAccountCreate,
    limits: getDeviceAccountCreateAttemptLimits(),
    error: DeviceAccountCreateRateLimiterExceededError,
  },
  requestCodeAttemptPerAppcheckJti: {
    key: RateLimitPrefix.requestCodeAttemptPerAppcheckJti,
    limits: getAppcheckJtiAttemptLimits(),
    error: UserCodeAttemptAppcheckJtiLimiterExceededError,
  },
  addQuizAttemptPerIp: {
    key: RateLimitPrefix.addQuizAttemptPerIp,
    limits: getAddQuizPerIpLimits(),
    error: AddQuizAttemptIpRateLimiterExceededError,
  },
  addQuizAttemptPerPhone: {
    key: RateLimitPrefix.addQuizAttemptPerPhone,
    limits: getAddQuizPerPhoneLimits(),
    error: AddQuizAttemptPhoneRateLimiterExceededError,
  },
}
