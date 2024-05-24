import { NextRequest, NextResponse } from "next/server"
import { NextRequestWithAuth, withAuth } from "next-auth/middleware"

export const config = { matcher: ["/:username/transaction", "/checkout/:hash*"] }

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/checkout")) {
    return checkoutMiddleware(request)
  }

  return withAuth(request as NextRequestWithAuth)
}

async function checkoutMiddleware(request: NextRequest) {
  let returnUrl

  const searchParams = request.nextUrl.searchParams
  returnUrl = searchParams.get("returnUrl")
  if (!returnUrl && request.method === "POST") {
    try {
      const formData = await request.formData()
      returnUrl = formData.get("returnUrl")?.toString()
    } catch (error) {}

    try {
      const data = await request.json()
      returnUrl = data.returnUrl
    } catch (error) {}
  }

  returnUrl = returnUrl || request.referrer

  const response = NextResponse.next({ request })
  if (returnUrl !== "about:client") {
    response.headers.set("x-return-url", returnUrl)
  }
  return response
}
