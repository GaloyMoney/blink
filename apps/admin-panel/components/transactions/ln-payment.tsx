import { LightningPayment, LnPaymentStatus } from "../../generated"
import { formatDate } from "../../app/utils"

const emptyPayment: LightningPayment = {
  __typename: "LightningPayment",
  status: LnPaymentStatus.Pending,
  amount: 0,
  roundedUpFee: 0,
  createdAt: 0,
  confirmedAt: 0,
  request: "lnbc1000000000000000000000000000000000000000000000000000000000000",
  destination: "000000000000000000000000000000000000000000000000000000000000000000",
  revealedPreImage: "0000000000000000000000000000000000000000000000000000000000000000",
} as const

type Props = {
  payment: LightningPayment
}

const LnPayment: React.FC<Props> = ({ payment }) => {
  const data = payment || emptyPayment

  return (
    <div className="shadow p-6 min-w-0 rounded-lg shadow-xs overflow-hidden bg-white grid grid-cols-3 gap-4">
      <div>
        <p className="mb-4 font-semibold text-gray-600">Status</p>
        <p className={`text-gray-600`}>{data.status}</p>
      </div>
      <div>
        <p className="mb-4 font-semibold text-gray-600">Amount</p>
        <p className={`text-gray-600`}>{data.amount}</p>
      </div>
      <div>
        <p className="mb-4 font-semibold text-gray-600">Fee</p>
        <p className={`text-gray-600`}>{data.roundedUpFee}</p>
      </div>
      <div>
        <p className="mb-4 font-semibold text-gray-600">Created At</p>
        <p className={`text-gray-600`}>{formatDate(data.createdAt ?? 0)}</p>
      </div>
      <div>
        <p className="mb-4 font-semibold text-gray-600">Confirmed At</p>
        <p className={`text-gray-600`}>
          {data.confirmedAt ? formatDate(data.confirmedAt) : "--"}
        </p>
      </div>
      <div className="col-span-3">
        <p className="mb-4 font-semibold text-gray-600">Secret</p>
        <p className={`text-gray-600 break-all`}>{data.revealedPreImage}</p>
      </div>
      <div className="col-span-3">
        <p className="mb-4 font-semibold text-gray-600">Destination</p>
        <p className={`text-gray-600 break-all`}>{data.destination}</p>
      </div>
      <div className="col-span-3">
        <p className="mb-4 font-semibold text-gray-600">Request</p>
        <p className={`text-gray-600 break-all`}>{data.request || "--"}</p>
      </div>
    </div>
  )
}

export default LnPayment
