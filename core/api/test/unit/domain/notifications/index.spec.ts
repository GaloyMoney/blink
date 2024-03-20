import {
  InvalidNotificationCategoryError,
  InvalidPushBodyError,
  InvalidPushNotificationSettingError,
  InvalidPushTitleError,
  checkedToLocalizedPushBody,
  checkedToLocalizedPushContentsMap,
  checkedToLocalizedPushTitle,
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
    expect(checkedToLocalizedPushTitle("Circle Grew")).toBe(title)
  })

  it("fails when title is empty", () => {
    expect(checkedToLocalizedPushTitle("")).toBeInstanceOf(InvalidPushTitleError)
  })
})

describe("localized push body check", () => {
  it("passes when body in valid", () => {
    const body = "Your inner circle grew!"
    expect(checkedToLocalizedPushBody("Your inner circle grew!")).toBe(body)
  })

  it("fails when body is empty", () => {
    expect(checkedToLocalizedPushBody("")).toBeInstanceOf(InvalidPushBodyError)
  })
})

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
