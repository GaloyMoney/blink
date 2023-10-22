import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { env } from "@/env";
import ResultDisplay from "@/components/keys/result-display";

const addKey = async () => {
  "use server"

  redirect("/keys/create")
}

// FIXME: userId not necessary?
const deleteKeys = async () => {
  "use server"

  const session = await getServerSession(authOptions)
  const userId = session?.sub

  const subject = userId
  const CLIENT_ID_APP_API_KEY = env.CLIENT_ID_APP_API_KEY;
  
  const baseUrl = env.HYDRA_ADMIN;
  const url = `${baseUrl}/admin/oauth2/auth/sessions/consent?subject=${subject}&client=${CLIENT_ID_APP_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error('Server-side error: ' + errorData.error);
    }
    
    const data = await response.json();
    console.log('Success:', data);
  } catch (error) {
    if (error instanceof Error) console.error('Error:', error.message);
  }

  redirect("/keys")
}

export type ConsentObject = {
  grant_scope: string[],
  grant_access_token_audience: any[],
  session: {
    access_token: object,
    id_token: object
  },
  remember: boolean,
  remember_for: number,
  handled_at: string,
  consent_request: {
    challenge: string,
    requested_scope: string[],
    requested_access_token_audience: any[],
    skip: boolean,
    subject: string,
    oidc_context: object,
    client: {
      client_id: string,
      [key: string]: any // This is to cover other properties of the 'client' object.
    },
    [key: string]: any // This is to cover other properties of the 'consent_request' object.
  },
  [key: string]: any // This is to cover other properties of the main object.
};

export default async function page() {
    const session = await getServerSession(authOptions)
    const userId = session?.sub

    let keys: ConsentObject[] = [];

    try {
      const url = `http://localhost:4445/admin/oauth2/auth/sessions/consent?subject=${userId}`;
      const response = await fetch(url);  
      const result = await response.json() as ConsentObject[];
      keys = result.filter(item => item.consent_request.client.client_id === env.CLIENT_ID_APP_API_KEY)

      console.dir(keys, { depth: null})
    } catch (error) {
      console.error('Error fetching consent session:', error);
    }

    return (
    <>
      <div className="grid-flow-col	grid p-6">
        <form action={addKey}>
            <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Add key</button>
        </form>
        <form action={deleteKeys}>
            <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete keys</button>
        </form>
      </div>
      
      {keys.length ? <div className="p-6">
        <h2 className="text-2xl font-semibold mb-8">Existing keys</h2>
        <ResultDisplay data={keys} />
      </div>: null}
    </>
  )
  }