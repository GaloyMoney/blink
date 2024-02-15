import { checkedToUsername } from "."

export const UsernameParser = (username: UsernameWithFlags) => {
  const stripUsdFlag = () => checkedToUsername(username.slice(0, -4))
  const isUsdCheck = () => username.slice(-4).toLowerCase() === "+usd"

  const isUsd = () => {
    const usdCheck = isUsdCheck()
    if (usdCheck) {
      const strippedUsername = stripUsdFlag()
      if (strippedUsername instanceof Error) return strippedUsername
    }

    return usdCheck
  }

  const parsedUsername = (): Username | ValidationError => {
    const usdCheck = isUsdCheck()
    return usdCheck ? stripUsdFlag() : checkedToUsername(username)
  }

  return {
    isUsd,
    parsedUsername,
  }
}
