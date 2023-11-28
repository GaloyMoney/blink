import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { username: string } },
) {
  const username = params.username

  const { searchParams } = new URL(request.url)
  const memo = searchParams.get("memo")

  let startUrl = `/${username}`

  if (memo) {
    startUrl = `${startUrl}?memo=${memo}`
  }

  const manifest = {
    name: "POS Cash Register",
    short_name: `${username} Register`,
    description:
      "A Bitcoin POS cash register application that connects with the merchant's wallet",
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    background_color: "#536FF2",
    theme_color: "#536FF2",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/manifest-logo/logo72x72.svg",
        type: "image/svg",
        sizes: "72x72",
      },
      {
        src: "/manifest-logo/logo96x96.svg",
        type: "image/svg",
        sizes: "96x96",
      },
      {
        src: "/manifest-logo/logo128x128.svg",
        type: "image/svg",
        sizes: "128x128",
      },
      {
        src: "/manifest-logo/logo144x144.svg",
        type: "image/svg",
        sizes: "144x144",
      },
      {
        src: "/manifest-logo/logo152x152.svg",
        type: "image/svg",
        sizes: "152x152",
      },
      {
        src: "/manifest-logo/logo192x192.svg",
        type: "image/svg",
        sizes: "192x192",
      },
      {
        src: "/manifest-logo/logo384x384.svg",
        type: "image/svg",
        sizes: "384x384",
      },
      {
        src: "/manifest-logo/logo512x512.svg",
        type: "image/svg",
        sizes: "512x512",
      },
    ],
  }

  NextResponse.json(manifest)
}
