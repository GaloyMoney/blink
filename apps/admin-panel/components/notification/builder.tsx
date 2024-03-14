"use client"

import { ChangeEvent, useState } from "react"
import { DeepLink } from "../../generated"
import { LanguageCodes } from "./languages"

export type NotificationContent = {
  localizedPushContents: LocalizedPushContent[]
  deepLink: DeepLink | undefined
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

  const onSetDeepLink = (e: ChangeEvent<HTMLSelectElement>) => {
    setNotification({ ...notification, deepLink: e.target.value as DeepLink })
  }
  const addPushContent = (localizedPushContent: LocalizedPushContent) => {
    setNotification({
      ...notification,
      localizedPushContents: [
        ...notification.localizedPushContents.filter(({ language }) => {
          return language !== localizedPushContent.language
        }),
        localizedPushContent,
      ],
    })
  }

  const removePushContent = (language: string) => {
    setNotification({
      ...notification,
      localizedPushContents: notification.localizedPushContents.filter(
        (content) => content.language !== language,
      ),
    })
  }

  const onAddContent = (event: React.FormEvent) => {
    event.preventDefault()
    addPushContent({ title, body, language })
    setTitle("")
    setBody("")
    setLanguage(LanguageCodes.English)
  }

  return (
    <div className="rounded bg-white mt-6 p-6 space-y-4 ">
      <h2>Notification Content</h2>
      <form className="space-y-4">
        <div>
          <label htmlFor="deepLink">Deep Link</label>
          <select
            className="border border-2 rounded block p-1 w-full"
            id="deepLink"
            value={notification.deepLink}
            onChange={onSetDeepLink}
          >
            <option value="">None</option>
            {Object.values(DeepLink).map((deepLink) => {
              return (
                <option key={deepLink} value={deepLink}>
                  {deepLink}
                </option>
              )
            })}
          </select>
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
        {notification.localizedPushContents.map((localizedPushContent) => (
          <LocalizedPushContentCard
            key={localizedPushContent.language}
            localizedPushContent={localizedPushContent}
            onRemove={() => removePushContent(localizedPushContent.language)}
          />
        ))}
      </div>
    </div>
  )
}

type LocalizedPushContent = {
  title: string
  body: string
  language: string
}

type LocalizedPushContentCardProps = {
  localizedPushContent: LocalizedPushContent
  onRemove: () => void
}

const LocalizedPushContentCard = ({
  localizedPushContent,
  onRemove,
}: LocalizedPushContentCardProps) => {
  return (
    <div className="border border-2 rounded p-6 min-w-[25rem]">
      <button onClick={onRemove} className="text-red-500 float-right">
        x
      </button>
      <p>Language: {localizedPushContent.language}</p>
      <p>Title: {localizedPushContent.title}</p>
      <p>Body: {localizedPushContent.body}</p>
    </div>
  )
}

export default NotificationBuilder
