export interface ICookieOptions {
  maxAge?: number | undefined
  signed?: boolean | undefined
  expires?: Date | undefined
  httpOnly?: boolean | undefined
  path?: string | undefined
  domain?: string | undefined
  secure?: boolean | undefined
  encode?: ((val: string) => string) | undefined
  sameSite?: boolean | "lax" | "strict" | "none" | undefined
}
