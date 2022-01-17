import childProcess from "child_process"
import { promisify } from "util"

import kill from "tree-kill"

export type PID = number & { readonly brand: unique symbol }

export const startServer = async (serverStartMessage = "Server ready"): Promise<PID> => {
  return new Promise<PID>((resolve) => {
    const serverProcess = childProcess.spawn("make", ["start-api-ci"])
    const serverPid = serverProcess.pid as PID
    serverProcess.stdout.on("data", (data) => {
      console.debug(`stdout: ${data.toString()}`)
      if (data.includes(serverStartMessage)) {
        resolve(serverPid)
      }
      serverProcess.removeAllListeners()
    })
    serverProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data.toString()}`)
    })
  })
}

const killAsync = promisify<number, string>(kill)

export const killServer = async (serverPid: PID): Promise<void> =>
  killAsync(serverPid, "SIGTERM")
