import { getLocale } from "@config"

export const getLangageOrDefault = (userLang: UserLanguageOrEmpty) =>
  userLang || (getLocale() as UserLanguage)
