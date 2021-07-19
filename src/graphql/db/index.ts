import { User } from "../../schema"

export async function usernameExists({ username }): Promise<boolean> {
  return Boolean(await User.getUser({ username }))
}
