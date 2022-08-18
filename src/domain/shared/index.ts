import { InvalidUrl } from "@domain/errors"

export * from "./primitives"
export * from "./calculator"
export * from "./errors"

const UrlRegex =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/
export const checkedToUrl = (url: string): Url | ValidationError => {
  if (!url.match(UrlRegex)) return new InvalidUrl(url)
  return url as Url
}
