export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const res = await import("./services/db/schema")
    res.default()
  }
}
