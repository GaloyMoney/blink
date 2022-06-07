export async function sleep(ms: MilliSeconds | number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function timeout(delay: MilliSeconds | number, msg: string) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(msg))
    }, delay)
  })
}
