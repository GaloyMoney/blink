import { NextResponse } from "next/server"

export async function POST(request: Request) {
  let returnUrl, hash
  try {
    const formData = await request.formData()
    hash = formData.get("hash")?.toString()
    returnUrl = formData.get("returnUrl")?.toString()
  } catch (error) { }

  try {
    const data = await request.json()
    hash = data.hash
    returnUrl = data.returnUrl
  } catch (error) { }

  if (!hash) {
    return Response.json({ error: "Invalid hash"}, { status: 404 })
  }

  returnUrl = returnUrl || request.referrer

  const response = NextResponse.redirect(`${request.url}/${hash}`)
  response.headers.set("x-return-url", returnUrl)
  return response
}
