import { baseLogger as log } from "@services/logger"
import { IbexEventError } from "."

export const logRequest = (method: string, params: any): void => {
    log.info(params, `Calling Ibex.${method}. Request params:`)
}

export const logResponse = (e: any) => {
    if (e instanceof IbexEventError) log.error(e)
    else log.info(e, "Response Data:")
    return e
}