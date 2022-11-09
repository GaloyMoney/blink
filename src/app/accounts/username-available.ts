import { checkedToUsername } from "@domain/accounts"

export const usernameAvailable =
  (loader) =>
  async (username: Username): Promise<boolean | ApplicationError> => {
    const checkedUsername = checkedToUsername(username)
    if (checkedUsername instanceof Error) return checkedUsername

    const account = await loader.load(checkedUsername)

    if (account instanceof Error) return account

    return account === undefined ? true : false
  }
