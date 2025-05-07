import { GT } from "@/graphql/index"

const ContactType = GT.Enum({
  name: "ContactType",
  values: {
    INTRALEDGER: { value: "intraledger" },
    LNADDRESS: { value: "lnaddress" },
  },
})

export default ContactType
