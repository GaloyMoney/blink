import { NotificationChannel as NotificationChannelDomain } from "@/domain/notifications"
import { GT } from "@/graphql/index"

const NotificationChannel = GT.Enum({
  name: "NotificationChannel",
  values: {
    PUSH: { value: NotificationChannelDomain.Push },
  },
})

export default NotificationChannel
