import { AuditedAccount } from "../generated"

export type AuditedAccountMainValues = Omit<AuditedAccount, "wallets">
