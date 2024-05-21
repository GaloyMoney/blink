export async function register() {
  console.log("register", process.env.NEXT_RUNTIME)

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node")
    try {
      const db = await import("./services/db/knex")
      // TODO use ts migration files.
      await db.knex.migrate.latest({
        directory: "./services/db/migrations",
        loadExtensions: [".mjs"],
        extension: "mjs",
      })
    } catch (err: unknown) {
      console.log("Error making migrations", err)
    }
  }
}
