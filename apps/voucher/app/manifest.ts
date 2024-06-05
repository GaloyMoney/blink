import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Blink Voucher",
    short_name: "Voucher",
    start_url: "/",
    display: "standalone",
    related_applications: [
      {
        platform: "play",
        id: "com.blink.pos.companion",
        url: "https://github.com/GaloyMoney/pos-print-companion",
      },
    ],
    icons: [
      {
        src: "/blink-logo.svg",
        sizes: "any",
        type: "image/svg",
      },
    ],
  }
}
