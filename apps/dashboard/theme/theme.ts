import { extendTheme } from "@mui/joy/styles"
import { Inter_Tight } from "next/font/google"

const inter = Inter_Tight({
  subsets: ["latin"],
})

const theme = extendTheme({
  fontFamily: {
    body: inter.style.fontFamily,
    display: inter.style.fontFamily,
    code: inter.style.fontFamily,
  },
})

export default theme
