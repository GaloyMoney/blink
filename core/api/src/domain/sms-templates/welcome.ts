import { WalletCurrency } from "@/domain/shared"

export const welcomeSmsTemplate = ({
  amount,
  currency,
  phoneNumber,
}: WelcomeTemplateParams): string => {
  const formattedAmount =
    currency === WalletCurrency.Btc ? `${amount} SATs` : `$${amount.toFixed(2)}`

  return [
    `🎉 Welcome to Blink!`,
    `You've just received ⚡${formattedAmount}.`,
    `Your wallet is ready to use.`,
    `📲 Install Blink: https://blink.sv`,
    `Already have the app? Log in with your phone number ${phoneNumber}.`,
  ].join("\n")
}
