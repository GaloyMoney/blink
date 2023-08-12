export const getCallbackServiceConfig = () => {
  // FIXME type when env.ts PR is merged
  const secret = process.env.SVIX_SECRET as string
  const endpoint = process.env.SVIX_ENDPOINT as string
  return { secret, endpoint }
}

import { CallbackService } from "."

const main = async () => {
  const callbackService = CallbackService(getCallbackServiceConfig())

  const res = await callbackService.sendMessage({
    accountUUID: "4ccab54e-afaa-467c-8fc4-03e14c22a12c" as any,
    eventType: "lightning" as any,
    payload: {
      test: "test",
    },
  })

  console.log({ res })
}

main()
