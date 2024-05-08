import { randomUserId } from "./random"

import { NotificationsServiceUnreachableServerError } from "@/domain/notifications"

import { NotificationsService } from "@/services/notifications"

import { sleep } from "@/utils"

export const waitFor = async (f: () => Promise<unknown>) => {
  let res
  while (!(res = await f())) await sleep(500)
  return res
}

// Note: this is to fix flakiness with notifications service health check. This waiting
//       should eventually happen in the tiltfile somehow.
export const waitForNotificationsService = () =>
  waitFor(async () => {
    const res = await NotificationsService().getUserNotificationSettings(randomUserId())
    return !(res instanceof NotificationsServiceUnreachableServerError)
  })
