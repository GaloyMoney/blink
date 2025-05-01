import { NextRequest, NextResponse } from "next/server"
import { getParams } from "js-lnurl"

export async function POST(request: NextRequest) {
  try {
    const { lnurl, paymentRequest } = await request.json()

    if (!lnurl) {
      return NextResponse.json(
        { error: "Missing lnurl parameter" },
        { status: 400 }
      )
    }

    if (!paymentRequest) {
      return NextResponse.json(
        { error: "Missing paymentRequest parameter" },
        { status: 400 }
      )
    }

    const lnurlParams = await getParams(lnurl)

    if (lnurlParams.tag !== "withdrawRequest") {
      return NextResponse.json(
        { error: "Not a properly configured lnurl withdraw tag" },
        { status: 400 }
      )
    }

    const { callback, k1 } = lnurlParams

    const urlObject = new URL(callback)
    const searchParams = urlObject.searchParams
    searchParams.set("k1", k1)
    searchParams.set("pr", paymentRequest)

    const url = urlObject.toString()

    const result = await fetch(url)
    const data = await result.json()

    return NextResponse.json(data, { status: result.ok ? 200 : 400 })


    // If we only have lnurl, just get the params
    const params = await getParams(lnurl)
    return NextResponse.json(params)
  } catch (error) {
    console.error("Error processing LNURL request:", error)
    return NextResponse.json(
      { error: "Failed to process LNURL request" },
      { status: 500 }
    )
  }
}
