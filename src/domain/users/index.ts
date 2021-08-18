export const UserLanguage = {
  EN_US: "en",
  ES_SV: "es",
} as const

export const getUsernameRegex = () => /(?!^(1|3|bc1|lnbc1))^[0-9a-z_]+$/i
