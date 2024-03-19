import { checkedToLocalizedPushContentsMap } from "@/domain/notifications"
import {
  InvalidPushBodyError,
  InvalidPushTitleError,
  InvalidPushNotificationSettingError,
} from "@/domain/notifications/errors"

describe("localized push contents map check", () => {
  it("passes when contents are valid", () => {
    const contents = [
      { title: "Title", body: "Body", language: "en" },
      { title: "Titulo", body: "Cuerpo", language: "es" },
    ]
    expect(checkedToLocalizedPushContentsMap(contents)).toBeInstanceOf(Map)
  })

  it("fails when there are duplicate languages", () => {
    const contents = [
      { title: "Title", body: "Body", language: "en" },
      { title: "Title", body: "Body", language: "en" },
    ]
    expect(checkedToLocalizedPushContentsMap(contents)).toBeInstanceOf(
      InvalidPushNotificationSettingError,
    )
  })

  it("fails when title is invalid", () => {
    const contents = [{ title: "", body: "Body", language: "en" }]
    expect(checkedToLocalizedPushContentsMap(contents)).toBeInstanceOf(
      InvalidPushTitleError,
    )
  })

  it("fails when body is invalid", () => {
    const contents = [{ title: "Title", body: "", language: "en" }]
    expect(checkedToLocalizedPushContentsMap(contents)).toBeInstanceOf(
      InvalidPushBodyError,
    )
  })
})
