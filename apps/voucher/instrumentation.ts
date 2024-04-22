export async function register() {
  console.log("register", process.env.NEXT_RUNTIME)

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node")
    try {
      const db = await import("./services/db/schema")
      await db.createWithdrawLinksTable()
      console.log("Table created")
    } catch (err: unknown) {
      console.log("Error creating table", err)
    }
  }
}
