export function reportError(error: { message?: string }) {
  console.error(error)
  alert("[Error]: " + error.message || "unknown")
}

export function validPhone(phone: string) {
  return phone.length > 8 && phone.length <= 15 && phone.match(/^\+[1-9][0-9]{7,}$/)
}

export function validUsername(username: string) {
  return username.length >= 3 && username.match(/(?!^(1|3|bc1|lnbc1))^[0-9a-z_]{3,50}$/i)
}

export function validEmail(email: string) {
  return /^.+@\S+\.\S+$/.test(email)
}

export const formatDate = (timestamp: number) =>
  new Date(timestamp * 1e3).toLocaleString()

export const formatNumber = (val: string) =>
  countDecimals(val) > 8 ? Number(val).toFixed(8) : val

const countDecimals = (val: string) => {
  const value = Number(val)
  if (Math.floor(value.valueOf()) === value.valueOf()) return 0
  return value.toString().split(".")[1].length || 0
}
