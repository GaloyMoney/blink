import { baseLogger } from "@services/logger"

import { publishOkexPrice } from "test/helpers"

publishOkexPrice()
baseLogger.info("Okex price publish for stablesats started")
