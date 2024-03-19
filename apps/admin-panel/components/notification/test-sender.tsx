"use client"

import { useState } from "react"
import { NotificationContent } from "./builder"
import { triggerMarketingNotification, userIdByUsername } from "./notifcation-actions"

type NotificationTestSenderArgs = {
  notification: NotificationContent
}

const NotificationTestSender = ({ notification }: NotificationTestSenderArgs) => {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [success, setSuccess] = useState(false)

  const sendTestNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError(undefined)

    const userIdRes = await userIdByUsername(username)

    if (userIdRes.userId === undefined) {
      setLoading(false)
      setError(userIdRes.message)
      return
    }

    const res = await triggerMarketingNotification({
      userIdsFilter: [userIdRes.userId],
      localizedPushContents: notification.localizedPushContents,
      deepLink: notification.deepLink,
    })
    setLoading(false)

    if (res.success) {
      setSuccess(true)
      return
    } else {
      setError(res.message)
    }
  }

  return (
    <div className="rounded bg-white mt-6 p-6 space-y-4 flex-1 max-w-lg">
      <h2>Send Test Notification</h2>
      <div>
        <form onSubmit={sendTestNotification} className="space-y-4">
          <div>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="title"
              name="Username"
              placeholder="Enter username"
              className="border border-2 rounded block p-1 w-full"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <button
            disabled={!username}
            className="bg-blue-500 text-white px-4 py-2 rounded block w-full disabled:opacity-50"
          >
            Send Test Notification
          </button>
          {loading && <p>Sending...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">Notification sent successfully</p>}
        </form>
      </div>
    </div>
  )
}

export default NotificationTestSender
