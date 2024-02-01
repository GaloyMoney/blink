import { redirect } from "next/navigation"

async function Home() {
  redirect("/account")
}

export default Home
