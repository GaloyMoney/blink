import { Scope } from "@/services/graphql/generated"

export const formatDate = (timestamp: number): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }
  return new Date(timestamp * 1000).toLocaleDateString(undefined, options)
}

export const getScopeText = (scopes: readonly Scope[]): string => {
  if (scopes.length > 0) {
    return scopes.join(", ")
  } else {
    return "No Scopes Defined"
  }
}
