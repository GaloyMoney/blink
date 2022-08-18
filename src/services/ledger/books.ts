import { Book, Entry as MediciEntryFromPackage } from "medici"

import { Transaction, TransactionMetadata } from "./schema"

export const MainBook = new Book<ILedgerTransaction>("MainBook")

export { Transaction, TransactionMetadata, MediciEntryFromPackage }
