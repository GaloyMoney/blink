export const UsernameParser = (username: Username) => {
  return {
    isUsd: () => username.slice(-4).toLowerCase() === "+usd",
  }
}
