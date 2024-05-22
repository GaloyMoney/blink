import CreatePage from "@/app/create/client-side-page"
import { env } from "@/env"

export default function Page() {
  const platformFeesInPpm = env.PLATFORM_FEES_IN_PPM

  return <CreatePage platformFeesInPpm={platformFeesInPpm} />
}
