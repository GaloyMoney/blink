import { Book, Entry as MediciEntryFromPackage } from "medici"

import { Transaction, TransactionMetadata } from "./schema"

export const MainBook = new Book("MainBook", { balanceSnapshotSec: 0 })

export { Transaction, TransactionMetadata, MediciEntryFromPackage }
