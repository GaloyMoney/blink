import { caseInsensitiveRegex } from "@services/mongoose"
import { User } from "@services/mongoose/schema"

export async function usernameExists({ username }): Promise<boolean> {
  return Boolean(await User.findOne({ username: caseInsensitiveRegex(username) }))
}
