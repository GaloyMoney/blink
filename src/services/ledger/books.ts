import { Book, Entry as MediciEntryFromPackage } from "medici"

import { Transaction, TransactionMetadata } from "./schema"

export const MainBook = new Book("MainBook")

export { Transaction, TransactionMetadata, MediciEntryFromPackage }
