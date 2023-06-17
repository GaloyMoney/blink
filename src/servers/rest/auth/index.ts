import cookies from "./cookies"
import email from "./email"
import deviceAccount from "./device-account"
import { authRouter } from "./router"

// we just need to import the file
// to get the routes registered
cookies
email
deviceAccount

export default authRouter
