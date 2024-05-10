"use client"

import { ChangeEvent, useState } from "react"

import { DeepLinkScreen, DeepLinkAction, NotificationIcon } from "../../generated"

import { LanguageCodes } from "./languages"
import { NotificationAction } from "./types"

export type NotificationContent = {
  localizedNotificationContents: LocalizedNotificationContent[]
  action?: NotificationAction
  openDeepLink?: {
    screen?: DeepLinkScreen | undefined
    action?: DeepLinkAction | undefined
  }
  openExternalUrl?: {
    url: string
  }
  icon?: NotificationIcon | undefined
  shouldSendPush: boolean
  shouldAddToHistory: boolean
  shouldAddToBulletin: boolean
}

export type NotificationBuilderArgs = {
  notification: NotificationContent
  setNotification: (notification: NotificationContent) => void
}

const NotificationBuilder = ({
  notification,
  setNotification,
}: NotificationBuilderArgs) => {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [language, setLanguage] = useState(LanguageCodes.English)

  const onSetAction = (e: ChangeEvent<HTMLSelectElement>) => {
    switch (e.target.value as NotificationAction) {
      case NotificationAction.OpenDeepLink:
        setNotification({
          ...notification,
          action: NotificationAction.OpenDeepLink,
          openDeepLink: {
            screen: undefined,
            action: undefined,
          },
          openExternalUrl: undefined,
        })
        break
      case NotificationAction.OpenExternalUrl:
        setNotification({
          ...notification,
          action: NotificationAction.OpenExternalUrl,
          openDeepLink: undefined,
          openExternalUrl: {
            url: "",
          },
        })
        break
      default:
        setNotification({
          ...notification,
          action: undefined,
          openDeepLink: undefined,
          openExternalUrl: undefined,
        })
    }
  }

  const setOpenExternalUrl = (url: string) => {
    setNotification({
      ...notification,
      openExternalUrl: {
        url,
      },
    })
  }

  const onSetIcon = (e: ChangeEvent<HTMLSelectElement>) => {
    setNotification({
      ...notification,
      icon: e.target.value ? (e.target.value as NotificationIcon) : undefined,
    })
  }

  const onSetDeepLinkScreen = (e: ChangeEvent<HTMLSelectElement>) => {
    setNotification({
      ...notification,
      openDeepLink: {
        ...notification.openDeepLink,
        screen: e.target.value ? (e.target.value as DeepLinkScreen) : undefined,
      },
    })
  }

  const onSetDeepLinkAction = (e: ChangeEvent<HTMLSelectElement>) => {
    setNotification({
      ...notification,
      openDeepLink: {
        ...notification.openDeepLink,
        action: e.target.value ? (e.target.value as DeepLinkAction) : undefined,
      },
    })
  }

  const addNotificationContent = (
    localizedNotificationContent: LocalizedNotificationContent,
  ) => {
    setNotification({
      ...notification,
      localizedNotificationContents: [
        ...notification.localizedNotificationContents.filter(({ language }) => {
          return language !== localizedNotificationContent.language
        }),
        localizedNotificationContent,
      ],
    })
  }

  const removeNotificationContent = (language: string) => {
    setNotification({
      ...notification,
      localizedNotificationContents: notification.localizedNotificationContents.filter(
        (content) => content.language !== language,
      ),
    })
  }

  const onAddContent = (event: React.FormEvent) => {
    event.preventDefault()
    addNotificationContent({ title, body, language })
    setTitle("")
    setBody("")
    setLanguage(LanguageCodes.English)
  }

  return (
    <div className="rounded bg-white mt-6 p-6 space-y-4 ">
      <h2>Notification Content</h2>
      <form className="space-y-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="icon">Notification Icon</label>
            <select
              className="border border-2 rounded block p-1 w-full"
              id="icon"
              value={notification.icon}
              onChange={onSetIcon}
            >
              <option value="">None</option>
              {Object.values(NotificationIcon).map((icon) => {
                return (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                )
              })}
            </select>
          </div>
          <div>
            <label htmlFor="action">Action</label>
            <select
              className="border border-2 rounded block p-1 w-full"
              id="action"
              value={notification.action}
              onChange={onSetAction}
            >
              <option value="">None</option>
              {Object.values(NotificationAction).map((action) => {
                return (
                  <option key={action} value={action}>
                    {action}
                  </option>
                )
              })}
            </select>
          </div>

          {notification.action === NotificationAction.OpenDeepLink && (
            <>
              <div>
                <label htmlFor="deepLink">Deep Link Screen</label>
                <select
                  className="border border-2 rounded block p-1 w-full"
                  id="deepLinkScreen"
                  value={notification.openDeepLink?.screen}
                  onChange={onSetDeepLinkScreen}
                >
                  <option value="">None</option>
                  {Object.values(DeepLinkScreen).map((deepLinkScreen) => {
                    return (
                      <option key={deepLinkScreen} value={deepLinkScreen}>
                        {deepLinkScreen}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="deepLinkAction">Deep Link Action</label>
                <select
                  className="border border-2 rounded block p-1 w-full"
                  id="deepLinkAction"
                  value={notification.openDeepLink?.action}
                  onChange={onSetDeepLinkAction}
                >
                  <option value="">None</option>
                  {Object.values(DeepLinkAction).map((deepLinkAction) => {
                    return (
                      <option key={deepLinkAction} value={deepLinkAction}>
                        {deepLinkAction}
                      </option>
                    )
                  })}
                </select>
              </div>
            </>
          )}
          {notification.action === NotificationAction.OpenExternalUrl && (
            <div>
              <label htmlFor="openExternalUrl">Open External Url</label>
              <input
                type="text"
                id="openExternalUrl"
                placeholder="Enter url"
                name="openExternalUrl"
                className="block w-full"
                required
                value={notification.openExternalUrl?.url || ""}
                onChange={(e) => setOpenExternalUrl(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="space-x-4">
          <input
            type="checkbox"
            id="shouldSendPush"
            checked={notification.shouldSendPush}
            onChange={(e) =>
              setNotification({ ...notification, shouldSendPush: e.target.checked })
            }
          />
          <label htmlFor="shouldSendPush">Send Push Notification</label>
        </div>
        <div className="space-x-4">
          <input
            type="checkbox"
            id="shouldAddToHistory"
            checked={notification.shouldAddToHistory}
            onChange={(e) =>
              setNotification({ ...notification, shouldAddToHistory: e.target.checked })
            }
          />
          <label htmlFor="shouldAddToHistory">Add to History</label>
        </div>
        <div className="space-x-4">
          <input
            type="checkbox"
            id="shouldAddToBulletin"
            checked={notification.shouldAddToBulletin}
            onChange={(e) =>
              setNotification({ ...notification, shouldAddToBulletin: e.target.checked })
            }
          />
          <label htmlFor="shouldAddToBulletin">Add to Bulletin</label>
        </div>
      </form>
      <form className="bg-gray-100 rounded p-6 space-y-4" onSubmit={onAddContent}>
        <div>
          <label htmlFor="language">Language</label>
          <select
            className="border border-2 rounded block p-1 w-full"
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {Object.entries(LanguageCodes).map(([key, value]) => {
              return (
                <option key={key} value={value}>
                  {key}
                </option>
              )
            })}
          </select>
        </div>
        <div>
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            placeholder="Enter title"
            name="title"
            className="block w-full"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="body">Body</label>
          <textarea
            id="body"
            name="body"
            placeholder="Enter body"
            className="block w-full"
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded block w-full"
        >
          Add content
        </button>
      </form>
      <div className="flex flex-wrap gap-4">
        {notification.localizedNotificationContents.map(
          (localizedNotificationContent) => (
            <LocalizedNotificationContentCard
              key={localizedNotificationContent.language}
              localizedNotificationContent={localizedNotificationContent}
              onRemove={() =>
                removeNotificationContent(localizedNotificationContent.language)
              }
            />
          ),
        )}
      </div>
    </div>
  )
}

type LocalizedNotificationContent = {
  title: string
  body: string
  language: string
}

type LocalizedNotificationContentCardProps = {
  localizedNotificationContent: LocalizedNotificationContent
  onRemove: () => void
}

const LocalizedNotificationContentCard = ({
  localizedNotificationContent,
  onRemove,
}: LocalizedNotificationContentCardProps) => {
  return (
    <div className="border border-2 rounded p-6 min-w-[25rem]">
      <button onClick={onRemove} className="text-red-500 float-right">
        x
      </button>
      <p>Language: {localizedNotificationContent.language}</p>
      <p>Title: {localizedNotificationContent.title}</p>
      <p>Body: {localizedNotificationContent.body}</p>
    </div>
  )
}

export default NotificationBuilder
