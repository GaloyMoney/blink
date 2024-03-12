export { default } from "next-auth/middleware"
// TODO no such page right now, this is just so other pages are not blocked
export const config = { matcher: ["/:username/transaction"] }
