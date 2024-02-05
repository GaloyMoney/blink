import { AuditedAccount } from "../../generated"
import { formatDate } from "../../app/utils"

const Details: React.FC<{
  auditedAccount: AuditedAccount
}> = ({ auditedAccount }) => {
  return (
    <div className="shadow p-6 min-w-0 rounded-lg shadow-xs overflow-hidden bg-white grid grid-cols-2 gap-4">
      <div>
        <p className="mb-4 font-semibold text-gray-600">Account ID</p>
        <p className={`text-gray-600`}>{auditedAccount.id}</p>
      </div>
      <div>
        <p className="mb-4 font-semibold text-gray-600">Phone</p>
        <p className={`text-gray-600`}>{auditedAccount.owner?.phone}</p>
      </div>
      <div>
        <p className="mb-4 font-semibold text-gray-600">Email address</p>
        <p className={`text-gray-600`}>{auditedAccount.owner?.email?.address}</p>
      </div>
      <div>
        <p className="mb-4 font-semibold text-gray-600">Email verified</p>
        <p className={`text-gray-600`}>{String(auditedAccount.owner?.email?.verified)}</p>
      </div>
      <div>
        <p className="mb-4 font-semibold text-gray-600">Username</p>
        <p className={`text-gray-600`}>{auditedAccount.username || "--"}</p>
      </div>
      <div>
        <p className="mb-4 font-semibold text-gray-600">Title</p>
        <p className={`text-gray-600`}>{auditedAccount.title || "--"}</p>
      </div>
      <div>
        <p className="mb-4 font-semibold text-gray-600">Coordinates</p>
        <p className={`text-gray-600`}>
          {auditedAccount.coordinates ? (
            <a
              target="_blank"
              rel="noreferrer"
              className="underline"
              href={`https://maps.google.com/?q=${
                auditedAccount.coordinates?.latitude +
                "," +
                auditedAccount.coordinates?.longitude
              }`}
            >
              {auditedAccount.coordinates?.latitude +
                ", " +
                auditedAccount.coordinates?.longitude}
            </a>
          ) : (
            "--"
          )}
        </p>
      </div>
      <div className="col-span-2">
        <p className="mb-4 font-semibold text-gray-600">Created At</p>
        <p className={`text-gray-600`}>{formatDate(auditedAccount.createdAt)}</p>
      </div>
    </div>
  )
}

export default Details
