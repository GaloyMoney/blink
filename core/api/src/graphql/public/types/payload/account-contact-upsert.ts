import Contact from "../object/account-contact-upsert"

import IError from "@/graphql/shared/types/abstract/error"
import { GT } from "@/graphql/index"

const ContactUpdateOrCreatePayload = GT.Object({
  name: "ContactUpdateOrCreatePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    contact: {
      type: Contact,
    },
  }),
})

export default ContactUpdateOrCreatePayload
