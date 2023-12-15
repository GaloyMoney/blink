export async function register() {
  console.log("register", process.env.NEXT_RUNTIME)

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node")
  }
}
