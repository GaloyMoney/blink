import childProcess from "child_process"
import kill from "tree-kill"

let serverPid = 0

export const startServer = async (
  serverStartMessage = "Server ready",
): Promise<number> => {
  return new Promise<number>((resolve) => {
    if (!serverPid) {
      const serverProcess = childProcess.spawn("make", ["start-server-ci"])
      serverPid = serverProcess.pid
      serverProcess.stdout.on("data", (data) => {
        if (data.includes(serverStartMessage)) {
          resolve(serverPid)
        }
        serverProcess.removeAllListeners()
      })
    } else {
      resolve(serverPid)
    }
  })
}

export const killServer = async (): Promise<null> => {
  return new Promise<null>((resolve, reject) => {
    if (serverPid) {
      kill(serverPid, (error?) => {
        if (error) {
          reject(error)
        } else {
          resolve(null)
        }
        serverPid = 0
      })
    } else {
      resolve(null)
    }
  })
}
