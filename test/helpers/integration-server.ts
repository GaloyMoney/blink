import childProcess from "child_process"
import { promisify } from "util"

import kill from "tree-kill"

export type PID = number & { readonly brand: unique symbol }

export const startServer = async (
  serverStartMessage = "server ready at",
): Promise<PID> => {
  return new Promise<PID>((resolve) => {
    const serverProcess = childProcess.spawn("make", ["start-api-ci"], {
      killSignal: "SIGKILL",
    })
    const serverPid = serverProcess.pid as PID
    serverProcess.stdout.on("data", (data) => {
      console.log(data.toString())
      if (data.includes(serverStartMessage)) {
        resolve(serverPid)
      }
      serverProcess.removeAllListeners()
    })
  })
}

const killAsync = promisify<number, string>(kill)

export const killServer = async (serverPid: PID): Promise<void> =>
  killAsync(serverPid, "SIGKILL")
