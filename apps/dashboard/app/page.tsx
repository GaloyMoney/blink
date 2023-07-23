import { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]/route"
import { gql } from "@apollo/client"
import { apollo } from "./graphql"
import { MeDocument, MeQuery } from "./graphql/generated"

gql`
  query me {
    me {
      defaultAccount {
        id
        level
      }
    }
  }
`

export default async function Home(req: NextRequest) {
  const session = await getServerSession(authOptions)
  console.log("sessionHome", session)
  const isAuthed = session?.sub ?? false

  const token = session?.accessToken

  const client = apollo(token).getClient()

  let level: string | undefined = "undefined"

  try {
    const data = await client.query<MeQuery>({
      query: MeDocument,
    })
    level = data.data.me?.defaultAccount?.level
  } catch (e) {
    console.log("error", e)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {isAuthed && (
        <>
          <p>logged in</p>
          <p>UserId: {session.sub}</p>
          <p>Level: {level}</p>
        </>
      )}
      {!isAuthed && (
        <>
          <p>not logged in</p>
          <a href="/api/auth/signin">Sign in</a>
        </>
      )}
    </main>
  )
}
