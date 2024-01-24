// API registry: https://dash.readme.com/api/v1/api-registry/cpd51bloegfhl2
import IbexSDK, * as types from "./.api/apis/sing-in" // TODO: @sing-in@<uuid>
import { IbexEventError, IbexAuthenticationError, IbexApiError } from "./errors"
import { withAuth } from "./authentication";
import { logRequest, logResponse } from "./errors/logger"

// This is a wrapper around the Ibex api that handles authentication
class Ibex {
    private static instance: Ibex | null = null;
    private constructor() {}

    static getInstance(): Ibex {
        if (!Ibex.instance) {
            Ibex.instance = new Ibex();
        }
        return Ibex.instance;
    }

    async getAccountTransactions(metadata: types.GMetadataParam): Promise<types.GResponse200 | IbexAuthenticationError | IbexApiError> {
        logRequest("getAccountTransactions", metadata)
        return withAuth(() => IbexSDK.g(metadata))
            .catch(_ => new IbexApiError(_.status, _.data))
            .then(logResponse)
    }

    async createAccount(body: types.CreateAccountBodyParam): Promise<types.CreateAccountResponse201 | IbexAuthenticationError | IbexApiError> {
        logRequest("createAccount", body)
        return withAuth(() => IbexSDK.createAccount(body))
            .catch(_ => new IbexApiError(_.status, _.data))
            .then(logResponse)
    }

    async getAccountDetails(metadata: types.GetAccountDetailsMetadataParam): Promise<types.GetAccountDetailsResponse200 | IbexAuthenticationError | IbexApiError> {
        logRequest("getAccountDetails", metadata)
        return withAuth(() => IbexSDK.getAccountDetails(metadata))
            .catch(_ => new IbexApiError(_.status, _.data))
            .then(logResponse)
    }

    async generateBitcoinAddress(body: types.GenerateBitcoinAddressBodyParam): Promise<types.GenerateBitcoinAddressResponse201 | IbexAuthenticationError | IbexApiError> {
        logRequest("generateBitcoinAddress", body)
        return withAuth(() => IbexSDK.generateBitcoinAddress(body))
            .catch(_ => new IbexApiError(_.status, _.data))
            .then(logResponse) 
    }

    async addInvoice(body: types.AddInvoiceBodyParam): Promise<types.AddInvoiceResponse201 | IbexAuthenticationError | IbexApiError> {
        logRequest("addInvoice", body)
        return withAuth(() => IbexSDK.addInvoice(body))
            .catch(_ => new IbexApiError(_.status, _.data))
            .then(logResponse)
    }

    // LN fee estimation
    // GetFeeEstimationResponse200 not defined
    async getFeeEstimation(metadata: types.GetFeeEstimationMetadataParam): Promise<types.GetFeeEstimationResponse200 | IbexAuthenticationError | IbexApiError> {
        logRequest("getFeeEstimation", metadata)
        return withAuth(() => IbexSDK.getFeeEstimation(metadata))
            .catch(_ => new IbexApiError(_.status, _.data))
            .then(logResponse)
    }

    async payInvoiceV2(body: types.PayInvoiceV2BodyParam): Promise<types.PayInvoiceV2Response200 | IbexAuthenticationError | IbexApiError> {
        logRequest("payInvoiceV2", body)
        return withAuth(() => IbexSDK.payInvoiceV2(body))
            .catch(_ => new IbexApiError(_.status, _.data))
            .then(logResponse)
    }

    async sendToAddressV2(body: types.SendToAddressCopyBodyParam): Promise<types.SendToAddressCopyResponse200 | IbexAuthenticationError | IbexApiError> {
        logRequest("sendToAddressV2", body)
        return withAuth(() => IbexSDK.sendToAddressCopy(body))
            .catch(_ => new IbexApiError(_.status, _.data))
            .then(logResponse)
    }

    // onchain fee estimation
    async estimateFeeV2(metadata: types.EstimateFeeCopyMetadataParam): Promise<types.EstimateFeeCopyResponse200 | IbexAuthenticationError | IbexApiError> {
        logRequest("estimateFeeV2", metadata)
        return withAuth(() => IbexSDK.estimateFeeCopy(metadata))
            .catch(_ => new IbexApiError(_.status, _.data))
            .then(logResponse)
    }
}

// TODO: Change to static class
export default Ibex.getInstance()
