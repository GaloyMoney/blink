import { Book, Entry as MediciEntryFromPackage } from "medici"

import { Transaction, TransactionMetadata } from "./schema"

const ADMIN_BALANCE_SNAPSHOT_SEC = 6 * 60 * 60

export const MainBook = new Book<ILedgerTransaction>("MainBook")
export const MainBookAdmin = new Book<ILedgerTransaction>("MainBook", {
  balanceSnapshotSec: ADMIN_BALANCE_SNAPSHOT_SEC,
})

export { Transaction, TransactionMetadata }
export type { MediciEntryFromPackage }
