import { wrapAsyncToRunInSpan } from "@services/tracing"
import { getUserForLogin as getUserForLoginFn } from "./get-user"

export * from "./username-available"
export * from "./update-contact-alias"
export * from "./get-contact-by-username"
export * from "./add-new-contact"

const telemetryWrappers = {
  getUserForLogin: wrapAsyncToRunInSpan({ fn: getUserForLoginFn }),
}

export const { getUserForLogin } = telemetryWrappers
