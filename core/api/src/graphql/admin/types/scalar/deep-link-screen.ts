import { DeepLinkScreen as DomainDeepLinkScreen } from "@/domain/notifications"
import { GT } from "@/graphql/index"

const DeepLinkScreen = GT.Enum({
  name: "DeepLinkScreen",
  values: {
    CIRCLES: {
      value: DomainDeepLinkScreen.Circles,
    },
    PRICE: {
      value: DomainDeepLinkScreen.Price,
    },
    EARN: {
      value: DomainDeepLinkScreen.Earn,
    },
    MAP: {
      value: DomainDeepLinkScreen.Map,
    },
    PEOPLE: {
      value: DomainDeepLinkScreen.People,
    },
    HOME: {
      value: DomainDeepLinkScreen.Home,
    },
    RECEIVE: {
      value: DomainDeepLinkScreen.Receive,
    },
    CONVERT: {
      value: DomainDeepLinkScreen.Convert,
    },
    SCAN_QR: {
      value: DomainDeepLinkScreen.ScanQR,
    },
    CHAT: {
      value: DomainDeepLinkScreen.Chat,
    },
    SETTINGS: {
      value: DomainDeepLinkScreen.Settings,
    },
    SETTINGS_2FA: {
      value: DomainDeepLinkScreen.Settings2FA,
    },
    SETTINGS_DISPLAY_CURRENCY: {
      value: DomainDeepLinkScreen.SettingsDisplayCurrency,
    },
    SETTINGS_DEFAULT_ACCOUNT: {
      value: DomainDeepLinkScreen.SettingsDefaultAccount,
    },
    SETTINGS_LANGUAGE: {
      value: DomainDeepLinkScreen.SettingsLanguage,
    },
    SETTINGS_THEME: {
      value: DomainDeepLinkScreen.SettingsTheme,
    },
    SETTINGS_SECURITY: {
      value: DomainDeepLinkScreen.SettingsSecurity,
    },
    SETTINGS_ACCOUNT: {
      value: DomainDeepLinkScreen.SettingsAccount,
    },
    SETTINGS_TX_LIMITS: {
      value: DomainDeepLinkScreen.SettingsTxLimits,
    },
    SETTINGS_NOTIFICATIONS: {
      value: DomainDeepLinkScreen.SettingsNotifications,
    },
    SETTINGS_EMAIL: {
      value: DomainDeepLinkScreen.SettingsEmail,
    },
  },
})

export default DeepLinkScreen
