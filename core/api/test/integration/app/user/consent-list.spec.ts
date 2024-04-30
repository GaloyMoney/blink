import { Admin } from "@/app"
import { consentList } from "@/services/hydra"
import { sleep } from "@/utils"
import { exec } from "child_process"
import puppeteer from "puppeteer"

let userId: UserId
const email = "test@galoy.io" as EmailAddress

beforeAll(async () => {
  const account = await Admin.getAccountByUserEmail(email)
  if (account instanceof Error) throw account

  userId = account.kratosUserId
})

const getOTP = (email: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const query = `docker exec -i galoy-dev-kratos-pg-1 psql -U dbuser -d default -t -c "SELECT body FROM courier_messages WHERE recipient='${email}' ORDER BY created_at DESC LIMIT 1;"`
    exec(query, (error, stdout, stderr) => {
      if (error) {
        reject(`error: ${error.message}`)
        return
      }
      if (stderr) {
        reject(`stderr: ${stderr}`)
        return
      }
      const otpMatch = stdout.match(/(\d{6})/)
      if (otpMatch && otpMatch[1]) {
        resolve(otpMatch[1])
      } else {
        reject("OTP not found in the message")
      }
    })
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
  await sleep(250)

  await page.click("#accept")

  await sleep(500)
  screenshots && (await page.screenshot({ path: "screenshot3.png" }))

  const otp = await getOTP(email)

  await page.waitForSelector("#code")
  await page.type("#code", otp, { delay: 100 })

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
