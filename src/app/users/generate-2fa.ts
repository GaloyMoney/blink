import { MissingPhoneError } from "@domain/errors"
import { TwoFA } from "@domain/twoFA"
import { UsersRepository } from "@services/mongoose"

export const generate2fa = async (
  userId: UserId,
): Promise<TwoFAGeneratedEntry | ApplicationError> => {
  const user = await UsersRepository().findById(userId)
  if (user instanceof Error) return user

  if (!user.phone) return new MissingPhoneError()

  const { secret } = TwoFA().generate()

  /*
    { secret: 'XDQXYCP5AC6FA32FQXDGJSPBIDYNKK5W',
      uri: 'otpauth://totp/My%20Awesome%20App:johndoe?secret=XDQXYCP5AC6FA32FQXDGJSPBIDYNKK5W&issuer=My%20Awesome%20App',
      qr: 'https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=otpauth://totp/My%20Awesome%20App:johndoe%3Fsecret=XDQXYCP5AC6FA32FQXDGJSPBIDYNKK5W%26issuer=My%20Awesome%20App'
    }
    */

  return { secret }
}
