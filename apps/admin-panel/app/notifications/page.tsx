"use client"

import { useState } from "react"
import NotificationBuilder, {
  NotificationContent,
} from "../../components/notification/builder"
import NotificationTestSender from "../../components/notification/test-sender"
import NotificationFilteredSender from "../../components/notification/filtered-sender"

export default function NotificationsScreen() {
  const [notification, setNotification] = useState<NotificationContent>({
    localizedPushContents: [],
    deepLink: undefined,
  })

  const notificationContainsEnglishContent = notification.localizedPushContents.some(
    (content) => content.language === "en",
  )

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-700">Marketing Notifications</h1>
      <NotificationBuilder
        notification={notification}
        setNotification={setNotification}
      />
      {notificationContainsEnglishContent && (
        <div className="flex space-x-6">
          <NotificationTestSender notification={notification} />
          <NotificationFilteredSender notification={notification} />
        </div>
      )}
    </div>
  )
}
