import {
  InvalidNotificationCategoryError,
  InvalidNotificationBodyError,
  InvalidPushNotificationSettingError,
  InvalidNotificationTitleError,
  checkedToLocalizedNotificationBody,
  checkedToLocalizedNotificationContentsMap,
  checkedToLocalizedNotificationTitle,
  checkedToNotificationCategory,
} from "@/domain/notifications"

describe("checkedToNotificationCategory", () => {
  it("passes when category is valid", () => {
    const category = "Circles"
    expect(checkedToNotificationCategory("Circles")).toBe(category)
  })

  it("fails when category is invalid", () => {
    expect(checkedToNotificationCategory("")).toBeInstanceOf(
      InvalidNotificationCategoryError,
    )
  })
})

describe("checkedToLocalizedPushTitle", () => {
  it("passes when title is valid", () => {
    const title = "Circle Grew"
    expect(checkedToLocalizedNotificationTitle("Circle Grew")).toBe(title)
  })

  it("fails when title is empty", () => {
    expect(checkedToLocalizedNotificationTitle("")).toBeInstanceOf(
      InvalidNotificationTitleError,
    )
  })
})

describe("localized push body check", () => {
  it("passes when body in valid", () => {
    const body = "Your inner circle grew!"
    expect(checkedToLocalizedNotificationBody("Your inner circle grew!")).toBe(body)
  })

  it("fails when body is empty", () => {
    expect(checkedToLocalizedNotificationBody("")).toBeInstanceOf(
      InvalidNotificationBodyError,
    )
  })
})

describe("localized push contents map check", () => {
  it("passes when contents are valid", () => {
    const contents = [
      { title: "Title", body: "Body", language: "en" },
      { title: "Titulo", body: "Cuerpo", language: "es" },
    ]
    expect(checkedToLocalizedNotificationContentsMap(contents)).toBeInstanceOf(Map)
  })

  it("fails when there are duplicate languages", () => {
    const contents = [
      { title: "Title", body: "Body", language: "en" },
      { title: "Title", body: "Body", language: "en" },
    ]
    expect(checkedToLocalizedNotificationContentsMap(contents)).toBeInstanceOf(
      InvalidPushNotificationSettingError,
    )
  })

  it("fails when title is invalid", () => {
    const contents = [{ title: "", body: "Body", language: "en" }]
    expect(checkedToLocalizedNotificationContentsMap(contents)).toBeInstanceOf(
      InvalidNotificationTitleError,
    )
  })

  it("fails when body is invalid", () => {
    const contents = [{ title: "Title", body: "", language: "en" }]
    expect(checkedToLocalizedNotificationContentsMap(contents)).toBeInstanceOf(
      InvalidNotificationBodyError,
    )
  })
})
