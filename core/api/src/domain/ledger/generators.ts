import { randomUUID } from "crypto"

import { checkedToLedgerExternalId } from "./validation"

export const randomLedgerExternalId = () => checkedToLedgerExternalId(randomUUID())
