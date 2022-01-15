import childProcess from "child_process"
import { promisify } from "util"

import kill from "tree-kill"

export type PID = number & { readonly brand: unique symbol }

let serverPid: PID = 0 as PID

export const startServer = async (serverStartMessage = "Server ready"): Promise<PID> => {
  return new Promise<PID>((resolve) => {
    if (serverPid) {
      resolve(serverPid)
      return
    }
    const serverProcess = childProcess.spawn("make", ["start-servers-ci"])
    serverPid = serverProcess.pid as PID
    serverProcess.stdout.on("data", (data) => {
      if (data.includes(serverStartMessage)) {
        resolve(serverPid)
      }
      serverProcess.removeAllListeners()
    })
  })
}

const killAsync = promisify(kill)

export const killServer = async (): Promise<void> => {
  await killAsync(serverPid)
  serverPid = 0 as PID
}
