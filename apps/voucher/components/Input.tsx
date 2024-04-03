import TextField from "@mui/material/TextField"
import React from "react"
import { createTheme, ThemeProvider } from "@mui/material/styles"

const theme = createTheme({
  palette: {
    primary: {
      main: "#000000",
    },
  },
})

const Input = ({ ...props }) => {
  return (
    <ThemeProvider theme={theme}>
      <TextField color="primary" variant="outlined" {...props} />
    </ThemeProvider>
  )
}

export default Input
