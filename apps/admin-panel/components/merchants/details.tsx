import { Merchant } from "../../generated"
import ConfirmForm from "../confirm"
import { deleteMerchant, validateMerchant } from "./update"

type Props = {
  merchants: readonly Merchant[]
}

export const Merchants = ({ merchants }: Props) => {
  return (
    <div className="p-6">
      {merchants.map((merchant) => (
        <div
          key={merchant.id}
          className="shadow p-6 min-w-0 rounded-lg shadow-xs overflow-hidden bg-white mb-4 flex justify-between items-center"
        >
          <div className="flex-grow">
            <p className="text-gray-600">
              <span className="font-semibold">Username:</span> {merchant.username}
              <span className="mx-4">•</span>
              <span className="font-semibold">Name:</span> {merchant.title}
              <span className="mx-4">•</span>
              <a
                href={`https://maps.google.com/?q=${merchant.coordinates.latitude},${merchant.coordinates.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
              >
                View Location
              </a>
              <span className="mx-4">•</span>
              <span className="font-semibold">Validated:</span>{" "}
              {String(merchant.validated)}
            </p>
          </div>
          {!merchant.validated && (
            <div>
              <ConfirmForm
                action={validateMerchant}
                message="Are you sure you want to activate this merchant?"
              >
                <input type="hidden" name="id" value={merchant.id} />
                <button className="mx-4 text-sm bg-green-500 hover:bg-green-700 text-white font-bold p-2 border border-green-700 rounded disabled:opacity-50">
                  Activate
                </button>
              </ConfirmForm>
            </div>
          )}
          <div>
            <ConfirmForm
              action={deleteMerchant}
              message="Are you sure you want to delete this merchant?"
            >
              <input type="hidden" name="id" value={merchant.id} />
              <button className="mx-4 text-sm bg-red-500 hover:bg-red-700 text-white font-bold p-2 border border-red-700 rounded disabled:opacity-50">
                Delete
              </button>
            </ConfirmForm>
          </div>
        </div>
      ))}
    </div>
  )
}
