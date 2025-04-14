import { WalletCurrency } from "@/domain/shared"
import { TWILIO_WELCOME_CONTENT_SID } from "@/config"

export const welcomeSmsTemplate = ({
  amount,
  currency,
  phoneNumber,
}: WelcomeTemplateParams): SmsTemplateResponse => {
  const formattedAmount =
    currency === WalletCurrency.Btc ? `${amount} SAT` : `$${amount.toFixed(2)}`

  return {
    contentSid: TWILIO_WELCOME_CONTENT_SID,
    contentVariables: {
      formattedAmount,
      phoneNumber,
    },
  }
}
