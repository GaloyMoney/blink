import ContactId from "@/graphql/shared/types/scalar/contact-id"
import ContactType from "@/graphql/shared/types/scalar/contact-type"
import Identifier from "@/graphql/shared/types/scalar/contact-identifier"
import ContactAlias from "@/graphql/public/types/scalar/contact-alias"
import Timestamp from "@/graphql/shared/types/scalar/timestamp"
import { GT } from "@/graphql/index"

const Contact = GT.Object<ContactRecord, GraphQLPublicContextAuth>({
  name: "Contact",
  fields: () => ({
    id: {
      type: GT.NonNull(ContactId),
      description: "ID of the contact user or external identifier.",
    },
    type: {
      type: GT.NonNull(ContactType),
      description: "Type of the contact (intraledger, lnaddress, etc.).",
    },
    identifier: {
      type: GT.NonNull(Identifier),
      description: "Username or lnAddress that identifies the contact.",
    },
    alias: {
      type: ContactAlias,
      description: "Alias name the user assigns to the contact.",
    },
    transactionsCount: {
      type: GT.NonNull(GT.Int),
      description: "Total number of transactions with this contact.",
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
      description:
        "Unix timestamp (number of seconds elapsed since January 1, 1970 00:00:00 UTC)",
    },
  }),
})

export default Contact
