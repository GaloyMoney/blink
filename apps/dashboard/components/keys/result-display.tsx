"use client"


import { deleteKey } from "@/app/keys/functions";
import { ConsentObject } from "@/app/keys/page";

type ResultDisplayProps = {
  data: ConsentObject[];
};

const ResultDisplay: React.FC<ResultDisplayProps> = async ({ data }) => {
  return (
    <div className="space-y-6">
      {data.map((item, index) => (
        <div key={index} className="border-b border-gray-300 p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl">Key #{index}</h3>
            <form action={async () => {
              await deleteKey(item.session_id)
              alert('Key deleted')}
            }>
            <button 
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Delete Key
            </button>
            </form>
          </div>
          <h3 className="font-bold text-xl">session ID:</h3>
          <p className="text-gray-500">{item.consent_request.login_session_id}</p>
          <h3 className="font-bold text-xl">challenge ID:</h3>
          <p className="text-gray-500">{item.consent_request.challenge}</p>
          <h3 className="font-bold text-xl">Granted Scope:</h3>
          <ul className="list-disc pl-5">
            {item.grant_scope.map((scope, idx) => (
              <li key={idx} className="text-gray-600">{scope}</li>
            ))}
          </ul>
          <h3 className="font-bold text-xl">Created At:</h3>
          <p className="text-gray-500">{item.handled_at}</p>
        </div>
      ))}
    </div>
  );
};

export default ResultDisplay;
