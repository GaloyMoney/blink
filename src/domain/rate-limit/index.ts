export const RateLimitPrefix = {
  requestPhoneCodeAttemptPerPhone: "phone_code_attempt_phone_code",
  requestPhoneCodeAttemptPerPhoneMinInterval:
    "phone_code_attempt_phone_code_min_interval",
  requestPhoneCodeAttemptPerIp: "phone_code_attempt_ip",
  failedLoginAttemptPerIp: "login_attempt_ip",
  failedLoginAttemptPerPhone: "login_attempt_phone",
  invoiceCreate: "invoice_create",
  invoiceCreateForRecipient: "invoice_create_for_recipient",
  onChainAddressCreate: "onchain_address_create",
} as const
