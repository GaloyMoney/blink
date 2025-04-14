type WelcomeTemplateParams = {
  amount: number
  currency: WalletCurrency
  phoneNumber: string
}

type SmsTemplateResponse = {
  contentSid: string
  contentVariables: Record<string, string>
}
