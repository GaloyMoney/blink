import { getLocale } from "@/config"

export const getLanguageOrDefault = (userLang: UserLanguageOrEmpty) =>
  userLang || (getLocale() as UserLanguage)
