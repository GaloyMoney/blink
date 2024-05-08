"use client"

import { useEffect, useState } from "react"

import { NotificationContent } from "./builder"
import {
  filteredUserCount as gqlFilteredUserCount,
  triggerMarketingNotification,
} from "./notification-actions"
import { CountryCodes } from "./languages"

type NotificationFilteredSenderArgs = {
  notification: NotificationContent
}

const NotificationFilteredSender = ({ notification }: NotificationFilteredSenderArgs) => {
  const [phoneCountryCodesFilter, setPhoneCountryCodesFilter] = useState<string[]>([])

  const [filteredUserCount, setFilteredUserCount] = useState<number | null>(null)
  const [loadingFilteredUserCount, setLoadingFilteredUserCount] = useState(false)
  const [loadingSendFilteredNotification, setLoadingSendFilteredNotification] =
    useState(false)
  const [sendFilteredNotificationError, setSendFilteredNotificationError] = useState<
    string | undefined
  >(undefined)
  const [sendFilteredNotificationSuccess, setSendFilteredNotificationSuccess] =
    useState(false)

  const getFilteredUserCount = async () => {
    setFilteredUserCount(null)
    setLoadingFilteredUserCount(true)
    const res = await gqlFilteredUserCount({
      phoneCountryCodesFilter,
    })
    setFilteredUserCount(res)
    setLoadingFilteredUserCount(false)
  }

  const removeCountryCode = (countryCode: string) => {
    setPhoneCountryCodesFilter(
      phoneCountryCodesFilter.filter((code) => code !== countryCode),
    )
    setFilteredUserCount(null)
  }

  const addCountryCode = (countryCode: string) => {
    if (phoneCountryCodesFilter.includes(countryCode)) {
      return
    }
    setPhoneCountryCodesFilter([...phoneCountryCodesFilter, countryCode])
    setFilteredUserCount(null)
  }

  const sendFilteredNotification = async () => {
    const receivedConfirmation = window.confirm(
      "Are you sure you want to send this notification?",
    )
    if (!receivedConfirmation) {
      return
    }

    setLoadingSendFilteredNotification(true)
    setSendFilteredNotificationError(undefined)
    setSendFilteredNotificationSuccess(false)

    const res = await triggerMarketingNotification({
      openDeepLink: notification.openDeepLink,
      openExternalUrl: notification.openExternalUrl,
      shouldSendPush: notification.shouldSendPush,
      shouldAddToHistory: notification.shouldAddToHistory,
      shouldAddToBulletin: notification.shouldAddToBulletin,
      localizedNotificationContents: notification.localizedNotificationContents,
      phoneCountryCodesFilter,
    })
    if (!res.success) {
      setSendFilteredNotificationError(res.message)
    } else {
      setSendFilteredNotificationSuccess(true)
    }
    setLoadingSendFilteredNotification(false)
  }

  useEffect(() => {
    setSendFilteredNotificationError(undefined)
    setSendFilteredNotificationSuccess(false)
  }, [notification])

  return (
    <div className="rounded bg-white mt-6 p-6 space-y-4 flex-1 max-w-lg">
      <h2>Send Filtered Notification</h2>
      <div className="space-y-4 border border-2 p-4 rounded">
        <h3>Countries</h3>
        <select
          onChange={(e) => addCountryCode(e.target.value)}
          value={""}
          className="border border-2 rounded"
        >
          <option value="">Add a country</option>
          {CountryCodes.map((countryCode) => (
            <option key={countryCode} value={countryCode}>
              {countryCode}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap space-x-4">
          {phoneCountryCodesFilter.length === 0 && (
            <span className="text-gray-500">Sending to all countries</span>
          )}
          {phoneCountryCodesFilter.map((phoneCountryCode) => (
            <RemovablePill
              text={phoneCountryCode}
              key={phoneCountryCode}
              onRemove={() => removeCountryCode(phoneCountryCode)}
            />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <button
          onClick={getFilteredUserCount}
          disabled={loadingFilteredUserCount}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Get user notification count
        </button>
        {loadingFilteredUserCount && <p>Loading...</p>}
        {filteredUserCount !== null && (
          <p>Users that will receive notification: {filteredUserCount}</p>
        )}
      </div>
      {!loadingSendFilteredNotification &&
        !sendFilteredNotificationError &&
        !sendFilteredNotificationSuccess && (
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded block w-full load:opacity-50"
            disabled={loadingSendFilteredNotification}
            onClick={sendFilteredNotification}
          >
            Send Filtered Notification
          </button>
        )}

      {loadingSendFilteredNotification && <p>Loading...</p>}
      {sendFilteredNotificationSuccess && (
        <p className="text-green-500">Notification sent successfully</p>
      )}
      {sendFilteredNotificationError && (
        <p className="text-red-500">{sendFilteredNotificationError}</p>
      )}
    </div>
  )
}

const RemovablePill = ({ text, onRemove }: { text: string; onRemove: () => void }) => {
  return (
    <div className="bg-gray-100 rounded p-2">
      <span className="mr-2">{text}</span>
      <button onClick={onRemove}>X</button>
    </div>
  )
}
export default NotificationFilteredSender
