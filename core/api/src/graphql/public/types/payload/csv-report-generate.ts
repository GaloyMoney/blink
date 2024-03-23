import { GT } from "@/graphql/index"
import IError from "@/graphql/shared/types/abstract/error"

const CsvReportGeneratePayload = GT.Object({
  name: "CsvReportGeneratePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    content: {
      type: GT.String,
    },
  }),
})

export default CsvReportGeneratePayload
