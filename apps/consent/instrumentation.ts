import { env } from "./env"

export async function register() {
  if (env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node")
  }
}
