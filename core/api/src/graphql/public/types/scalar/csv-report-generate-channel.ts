import { GT } from "@/graphql/index"

const CSVReportGenerateChannel = GT.Enum({
  name: "CSVReportGenerateChannel",
  values: {
    InlineBase64CSV: {},
  },
})

export default CSVReportGenerateChannel
