import puppeteer from "puppeteer"

import { Admin } from "@/app"
import { consentList } from "@/services/hydra"
import { sleep } from "@/utils"
import knex from "knex"

let userId: UserId
const email = "test@galoy.io" as EmailAddress

beforeAll(async () => {
  const account = await Admin.getAccountByUserEmail(email)
  if (account instanceof Error) throw account

  userId = account.kratosUserId
})

const db = knex({
  client: "pg",
  connection: "postgres://dbuser:secret@localhost:5432/default?sslmode=disable",
})

const getOTP = (email: string): Promise<string> => {
  return db<{ body: string }>("courier_messages") // Specifying the expected row structure
    .select("body")
    .where("recipient", email)
    .orderBy("created_at", "desc")
    .limit(1)
    .then((rows) => {
      if (rows.length === 0) {
        throw new Error("OTP not found in the message")
      }
      const otpMatch = rows[0].body.match(/(\d{6})/)
      if (otpMatch && otpMatch[1]) {
        return otpMatch[1]
      } else {
        throw new Error("OTP not found in the message")
      }
    })
    .catch((error) => {
      throw new Error(`Error retrieving OTP: ${error.message}`)
    })
}

async function performOAuthLogin() {
  const screenshots = false

  const browser = await puppeteer.launch()
  // const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  // Navigate the page to a URL
  await page.goto("http://localhost:3001/api/auth/signin")

  screenshots && (await page.screenshot({ path: "screenshot0.png" }))

  await page.waitForSelector(".button")
  await page.click(".button")

  screenshots && (await page.screenshot({ path: "screenshot1.png" }))

  await page.waitForSelector('[data-testid="email_id_input"]')
  await page.waitForFunction(
    "document.querySelector(\"[data-testid='email_id_input']\").isConnected",
  )
  await page.type('[data-testid="email_id_input"]', email)
  screenshots && (await page.screenshot({ path: "screenshot2.png" }))
  await sleep(1000)

  await page.click("#accept")

  await sleep(1000)
  screenshots && (await page.screenshot({ path: "screenshot3.png" }))

  const otp = await getOTP(email)

  await page.waitForSelector("#code")
  await page.type("#code", otp)

  screenshots && (await page.screenshot({ path: "screenshot4.png" }))
  await sleep(1500)
  screenshots && (await page.screenshot({ path: "screenshot5.png" }))

  await page.close()
  await browser.close()
}

describe("Hydra", () => {
  it("get an empty consent list", async () => {
    const res = await consentList(userId)
    expect(res).toEqual([])
  })

  it("get consent list when the user had perform oauth2 login", async () => {
    await performOAuthLogin()

    const res = await consentList(userId)
    expect(res).toEqual([
      {
        app: "dashboard",
        handledAt: expect.any(Date),
        remember: false,
        scope: ["read", "write"],
      },
    ])
  })
})
