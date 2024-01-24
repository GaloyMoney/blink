import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'sing-in/1.0 (api/6.1.1)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * **Refresh an AccessToken using a RefreshToken.**
   *
   * @summary Refresh Access Token
   * @throws FetchError<400, types.RefreshAccessTokenResponse400> 400
   */
  refreshAccessToken(body: types.RefreshAccessTokenBodyParam): Promise<FetchResponse<200, types.RefreshAccessTokenResponse200>> {
    return this.core.fetch('/auth/refresh-access-token', 'post', body);
  }

  /**
   * **Revoke a RefreshToken and all the AccessToken created with the RefreshToken**
   *
   * @summary Revoke Refresh Token
   * @throws FetchError<400, types.RevokeRefreshTokenResponse400> 400
   */
  revokeRefreshToken(body: types.RevokeRefreshTokenBodyParam): Promise<FetchResponse<204, types.RevokeRefreshTokenResponse204>> {
    return this.core.fetch('/auth/revoke-refresh-token', 'post', body);
  }

  /**
   * **Change the password of your account.**
   *
   * @summary Change Password
   * @throws FetchError<400, types.ChangePasswordResponse400> 400
   * @throws FetchError<401, types.ChangePasswordResponse401> 401
   */
  changePassword(body?: types.ChangePasswordBodyParam): Promise<FetchResponse<204, types.ChangePasswordResponse204>> {
    return this.core.fetch('/auth/change-password', 'post', body);
  }

  /**
   * **Send an email to the user to reset password.**
   *
   * The email indicated in the body will receive a Temporary Password.
   *
   * The temporary password is used by the /auth/confirm-forgot-password endpoint to set a
   * New Password
   *
   * @summary Forgot Password
   * @throws FetchError<400, types.ForgotPasswordResponse400> 400
   * @throws FetchError<404, types.ForgotPasswordResponse404> 404
   */
  forgotPassword(body?: types.ForgotPasswordBodyParam): Promise<FetchResponse<204, types.ForgotPasswordResponse204>> {
    return this.core.fetch('/auth/forgot-password', 'post', body);
  }

  /**
   * **Change the user password using the Temporary Password.**
   *
   * @summary Confirm Forgot Password
   * @throws FetchError<400, types.ConfirmForgotPasswordResponse400> 400
   * @throws FetchError<404, types.ConfirmForgotPasswordResponse404> 404
   */
  confirmForgotPassword(body?: types.ConfirmForgotPasswordBodyParam): Promise<FetchResponse<204, types.ConfirmForgotPasswordResponse204>> {
    return this.core.fetch('/auth/confirm-forgot-password', 'post', body);
  }

  /**
   * **Create an IBEXHub account with a name.**
   *
   * @summary Create Account
   * @throws FetchError<400, types.CreateAccountResponse400> 400
   * @throws FetchError<401, types.CreateAccountResponse401> 401
   */
  createAccount(body: types.CreateAccountBodyParam): Promise<FetchResponse<201, types.CreateAccountResponse201>> {
    return this.core.fetch('/account/create', 'post', body);
  }

  /**
   * **Get all IBEXHub accounts.**
   *
   * @summary All Accounts (deprecated)
   * @throws FetchError<400, types.GetAllTheAccountsOfTheUserResponse400> 400
   * @throws FetchError<401, types.GetAllTheAccountsOfTheUserResponse401> 401
   */
  getAllTheAccountsOfTheUser(): Promise<FetchResponse<200, types.GetAllTheAccountsOfTheUserResponse200>> {
    return this.core.fetch('/account/all', 'get');
  }

  /**
   * **Get information on one specific account and the balance of the account.**
   *
   * @summary Account Details
   * @throws FetchError<400, types.GetAccountDetailsResponse400> 400
   * @throws FetchError<401, types.GetAccountDetailsResponse401> 401
   * @throws FetchError<403, types.GetAccountDetailsResponse403> 403
   */
  getAccountDetails(metadata: types.GetAccountDetailsMetadataParam): Promise<FetchResponse<200, types.GetAccountDetailsResponse200>> {
    return this.core.fetch('/v2/account/{accountId}', 'get', metadata);
  }

  /**
   * **Update an account with new fields.**
   *
   * @summary Update Account
   * @throws FetchError<400, types.UpdateAccountResponse400> 400
   * @throws FetchError<401, types.UpdateAccountResponse401> 401
   * @throws FetchError<403, types.UpdateAccountResponse403> 403
   */
  updateAccount(body: types.UpdateAccountBodyParam, metadata: types.UpdateAccountMetadataParam): Promise<FetchResponse<200, types.UpdateAccountResponse200>> {
    return this.core.fetch('/account/{accountId}', 'put', body, metadata);
  }

  /**
   * **Add invoice.**
   *
   * @summary Add Invoice V2
   * @throws FetchError<400, types.AddInvoiceResponse400> 400
   * @throws FetchError<403, types.AddInvoiceResponse403> 403
   */
  addInvoice(body: types.AddInvoiceBodyParam): Promise<FetchResponse<201, types.AddInvoiceResponse201>> {
    return this.core.fetch('/v2/invoice/add', 'post', body);
  }

  /**
   * **Pay invoice.**
   *
   * @summary Pay Invoice (deprecated)
   * @throws FetchError<400, types.PayInvoiceResponse400> 400
   * @throws FetchError<403, types.PayInvoiceResponse403> 403
   * @throws FetchError<404, types.PayInvoiceResponse404> 404
   * @throws FetchError<422, types.PayInvoiceResponse422> 422
   * @throws FetchError<504, types.PayInvoiceResponse504> 504
   */
  payInvoice(body: types.PayInvoiceBodyParam): Promise<FetchResponse<200, types.PayInvoiceResponse200>> {
    return this.core.fetch('/invoice/pay', 'post', body);
  }

  /**
   * **Estimate the fee using the bolt11.**
   *
   * @summary Fee estimation
   * @throws FetchError<400, types.GetFeeEstimationResponse400> 400
   * @throws FetchError<404, types.GetFeeEstimationResponse404> 404
   */
  getFeeEstimation(metadata: types.GetFeeEstimationMetadataParam): Promise<FetchResponse<200, types.GetFeeEstimationResponse200>> {
    return this.core.fetch('/v2/invoice/estimate-fee', 'get', metadata);
  }

  /**
   * **Decode the information on the bolt11.**
   *
   * @summary Decoded Invoice
   * @throws FetchError<400, types.DecodeInvoiceResponse400> 400
   * @throws FetchError<401, types.DecodeInvoiceResponse401> 401
   * @throws FetchError<404, types.DecodeInvoiceResponse404> 404
   */
  decodeInvoice(metadata?: types.DecodeInvoiceMetadataParam): Promise<FetchResponse<200, types.DecodeInvoiceResponse200>> {
    return this.core.fetch('/invoice/decode', 'get', metadata);
  }

  /**
   * **Create a lnurl string**
   *
   * Generate a reusable LNURL-pay string. The account tied to this LNURL is credited every
   * time a payment is made to this static LNURL string
   *
   * @summary Create LNURL-pay
   * @throws FetchError<400, types.CreateLnurlPayResponse400> 400
   * @throws FetchError<403, types.CreateLnurlPayResponse403> 403
   */
  createLnurlPay(body: types.CreateLnurlPayBodyParam): Promise<FetchResponse<201, types.CreateLnurlPayResponse201>> {
    return this.core.fetch('/lnurl/pay', 'post', body);
  }

  /**
   * **Pay to a LNURL-pay string**
   *
   * To use this endpoint, decode a LNURL-pay QR code and perform a /GET request on the
   * decoded url to get the JSON response. Then, ask the user for an exact amount to send (if
   * necessary). Then, call this api with the necessary parameters
   *
   * * The JSON response from /GET call should be used as the params field in the request
   * body
   * * amountMsat has to be within the bounds of maxSendable and minSendable
   *
   * @summary Pay to a LNURL-pay
   * @throws FetchError<400, types.PayToALnurlPayResponse400> 400
   * @throws FetchError<403, types.PayToALnurlPayResponse403> 403
   */
  payToALnurlPay(body: types.PayToALnurlPayBodyParam): Promise<FetchResponse<201, types.PayToALnurlPayResponse201>> {
    return this.core.fetch('/v2/lnurl/pay/send', 'post', body);
  }

  /**
   * **Create a LNURL-withdraw string.**
   *
   * Generate a single-use LNURL-withdraw string. The account tied to this LNURL is debited
   * every time a successful withdrawal was initiated
   *
   * @summary Create LNURL-withdraw
   * @throws FetchError<400, types.CreateLnurlWithdrawResponse400> 400
   * @throws FetchError<403, types.CreateLnurlWithdrawResponse403> 403
   */
  createLnurlWithdraw(body: types.CreateLnurlWithdrawBodyParam): Promise<FetchResponse<201, types.CreateLnurlWithdrawResponse201>> {
    return this.core.fetch('/lnurl/withdraw', 'post', body);
  }

  /**
   * **Withdraw from a LNURL-withdraw string.**
   *
   * To use this endpoint, decode a LNURL-withdraw QR code and perform a /GET request on the
   * decoded url to get the JSON response. Then, ask the user for an exact amount to withdraw
   * (if necessary). Then, call this api with the necessary parameters
   *
   * The bolt11 returned is for tracking purposes. As per the protocol, the bolt11 is
   * supposed to be paid asynchronously; therefore caller of this api is responsible for
   * tracking the payment status of the bolt11
   *
   * @summary Withdraw from a LNURL-withdraw
   * @throws FetchError<400, types.WithdrawFromALnurlWithdrawResponse400> 400
   * @throws FetchError<403, types.WithdrawFromALnurlWithdrawResponse403> 403
   */
  withdrawFromALnurlWithdraw(body: types.WithdrawFromALnurlWithdrawBodyParam, metadata: types.WithdrawFromALnurlWithdrawMetadataParam): Promise<FetchResponse<200, types.WithdrawFromALnurlWithdrawResponse200>> {
    return this.core.fetch('/lnurl/withdraw/account/{account_id}', 'post', body, metadata);
  }

  /**
   * **Cancel a LNURL-withdraw string.**
   *
   * Invalidates an existing LNURL-withdraw string to prevent withdrawal.
   *
   * @summary Cancel a LNURL-withdraw
   * @throws FetchError<400, types.CancelALnurlWithdrawResponse400> 400
   * @throws FetchError<403, types.CancelALnurlWithdrawResponse403> 403
   */
  cancelALnurlWithdraw(metadata: types.CancelALnurlWithdrawMetadataParam): Promise<FetchResponse<200, types.CancelALnurlWithdrawResponse200>> {
    return this.core.fetch('/lnurl/withdraw/{lnurl}', 'delete', metadata);
  }

  /**
   * LNURL-Withdraw Status
   *
   * @throws FetchError<400, types.GetLnurlWithdrawStatusResponse400> 400
   * @throws FetchError<404, types.GetLnurlWithdrawStatusResponse404> 404
   */
  getLnurlWithdrawStatus(metadata: types.GetLnurlWithdrawStatusMetadataParam): Promise<FetchResponse<200, types.GetLnurlWithdrawStatusResponse200>> {
    return this.core.fetch('/lnurl/withdraw/{lnurl}', 'get', metadata);
  }

  /**
   * **Get all the currencies**
   *
   * @summary All Currencies
   * @throws FetchError<400, types.GetAllResponse400> 400
   */
  getAll(): Promise<FetchResponse<200, types.GetAllResponse200>> {
    return this.core.fetch('/currency/all', 'get');
  }

  /**
   * **Get the rate price of one bitcoin in the given fiat**
   *
   * @summary Rates (deprecated)
   * @throws FetchError<400, types.GetRatesResponse400> 400
   */
  getRates(metadata: types.GetRatesMetadataParam): Promise<FetchResponse<200, types.GetRatesResponse200>> {
    return this.core.fetch('/currency/rate/{fiat_id}', 'get', metadata);
  }

  /**
   * **Create and associate a lightning address to an IBEX Hub account**
   *
   * The IBEX Hub account tied to generated lightning address is credited every time a
   * payment is made to lightning address.
   *
   * Multiple lightning addresses could be associated to an IBEX Hub account
   *
   * @summary Create a Lightning Address
   * @throws FetchError<400, types.CreateALightningAddressResponse400> 400
   * @throws FetchError<403, types.CreateALightningAddressResponse403> 403
   */
  createALightningAddress(body: types.CreateALightningAddressBodyParam): Promise<FetchResponse<201, types.CreateALightningAddressResponse201>> {
    return this.core.fetch('/lightning-address', 'post', body);
  }

  /**
   * **Get all Lightning Adresses associated to an account**
   *
   * @summary All Lightning Addresses
   * @throws FetchError<400, types.GetAllLightningAdressesResponse400> 400
   * @throws FetchError<403, types.GetAllLightningAdressesResponse403> 403
   */
  getAllLightningAdresses(metadata: types.GetAllLightningAdressesMetadataParam): Promise<FetchResponse<200, types.GetAllLightningAdressesResponse200>> {
    return this.core.fetch('/lightning-address/all?account-id={account-id}', 'get', metadata);
  }

  /**
   * **Update the username of a lightning adress**
   *
   * @summary Update Lightning Address
   * @throws FetchError<400, types.UpdateLightningAddressResponse400> 400
   * @throws FetchError<403, types.UpdateLightningAddressResponse403> 403
   */
  updateLightningAddress(body: types.UpdateLightningAddressBodyParam, metadata: types.UpdateLightningAddressMetadataParam): Promise<FetchResponse<200, types.UpdateLightningAddressResponse200>> {
    return this.core.fetch('/lightning-address/{address-id}', 'put', body, metadata);
  }

  /**
   * **Delete lightning address associated to an IBEX Hub account**
   *
   * @summary Lightning Address
   * @throws FetchError<400, types.DeleteLightningAddressResponse400> 400
   * @throws FetchError<403, types.DeleteLightningAddressResponse403> 403
   */
  deleteLightningAddress(metadata: types.DeleteLightningAddressMetadataParam): Promise<FetchResponse<204, types.DeleteLightningAddressResponse204>> {
    return this.core.fetch('/lightning-address/{address-id}', 'delete', metadata);
  }

  /**
   * **Generate onchain address for an IBEXHub account.**
   *
   * Generate bitcoin onchain address for an IBEXHub account. Each call generates a new
   * address.
   *
   * Funds will only show up after a transaction's status is.
   *
   * @summary Generate Bitcoin Address
   * @throws FetchError<400, types.GenerateBitcoinAddressResponse400> 400
   * @throws FetchError<403, types.GenerateBitcoinAddressResponse403> 403
   */
  generateBitcoinAddress(body: types.GenerateBitcoinAddressBodyParam): Promise<FetchResponse<201, types.GenerateBitcoinAddressResponse201>> {
    return this.core.fetch('/onchain/address', 'post', body);
  }

  /**
   * Send bitcoin to a bitcoin address.
   *
   * @summary Send to Address (deprecated)
   * @throws FetchError<400, types.SendToAddressResponse400> 400
   * @throws FetchError<403, types.SendToAddressResponse403> 403
   */
  sendToAddress(body: types.SendToAddressBodyParam): Promise<FetchResponse<200, types.SendToAddressResponse200>> {
    return this.core.fetch('/onchain/send', 'post', body);
  }

  /**
   * Estimate fee required to send sats to onchain address
   *
   * @summary Estimate Fee (deprecated)
   * @throws FetchError<400, types.EstimateFeeResponse400> 400
   * @throws FetchError<404, types.EstimateFeeResponse404> 404
   */
  estimateFee(metadata: types.EstimateFeeMetadataParam): Promise<FetchResponse<200, types.EstimateFeeResponse200>> {
    return this.core.fetch('/onchain/estimate-fee?dest_address=&amount_sat=', 'get', metadata);
  }

  /**
   * **SignUp with your temporary password and set your own.**
   *
   * @summary Sign Up
   * @throws FetchError<400, types.SignUpResponse400> 400
   */
  signUp(body: types.SignUpBodyParam): Promise<FetchResponse<200, types.SignUpResponse200>> {
    return this.core.fetch('/auth/signup', 'post', body);
  }

  /**
   * **Sign in to receive Access/Refresh tokens.**
   *
   * @summary Sign In
   * @throws FetchError<400, types.SignInResponse400> 400
   */
  signIn(body: types.SignInBodyParam): Promise<FetchResponse<200, types.SignInResponse200>> {
    return this.core.fetch('/auth/signin', 'post', body);
  }

  /**
   * Get all of an accounts LNURL-withdraws
   *
   * @summary All LNURL-withdraws
   * @throws FetchError<400, types.GetAllLnurlWithdrawsResponse400> 400
   */
  getAllLnurlWithdraws(metadata: types.GetAllLnurlWithdrawsMetadataParam): Promise<FetchResponse<200, types.GetAllLnurlWithdrawsResponse200>> {
    return this.core.fetch('/lnurl/withdraw/all/{accountId}', 'get', metadata);
  }

  /**
   * **Get the rate of fiat to fiat, fiat to bitcoin or sats to fiat**
   *
   * @summary Rates V2
   */
  getRatesV2(metadata: types.GetRatesV2MetadataParam): Promise<FetchResponse<200, types.GetRatesV2Response200>> {
    return this.core.fetch('/v2/currencies/rate/{primary_currency_id}/{secondary_currency_id}', 'get', metadata);
  }

  /**
   * **Add invoice.**
   *
   * @summary Add Invoice (deprecated)
   * @throws FetchError<400, types.AddInvoiceV1DepreciatedResponse400> 400
   * @throws FetchError<403, types.AddInvoiceV1DepreciatedResponse403> 403
   */
  addInvoiceV1Depreciated(body: types.AddInvoiceV1DepreciatedBodyParam): Promise<FetchResponse<201, types.AddInvoiceV1DepreciatedResponse201>> {
    return this.core.fetch('/invoice/add', 'post', body);
  }

  /**
   * **Get invoices information using the Bolt11.**
   *
   * @summary From Bolt11
   * @throws FetchError<400, types.GetPaymentInfosFromBolt11Response400> 400
   * @throws FetchError<404, types.GetPaymentInfosFromBolt11Response404> 404
   */
  getPaymentInfosFromBolt11(metadata: types.GetPaymentInfosFromBolt11MetadataParam): Promise<FetchResponse<200, types.GetPaymentInfosFromBolt11Response200>> {
    return this.core.fetch('/payment/from-bolt11/{bolt11}', 'get', metadata);
  }

  /**
   * **Pay invoice.**
   *
   * @summary Pay Invoice V2
   * @throws FetchError<400, types.PayInvoiceV2Response400> 400
   * @throws FetchError<403, types.PayInvoiceV2Response403> 403
   * @throws FetchError<404, types.PayInvoiceV2Response404> 404
   * @throws FetchError<422, types.PayInvoiceV2Response422> 422
   * @throws FetchError<504, types.PayInvoiceV2Response504> 504
   */
  payInvoiceV2(body: types.PayInvoiceV2BodyParam): Promise<FetchResponse<200, types.PayInvoiceV2Response200>> {
    return this.core.fetch('/v2/invoice/pay', 'post', body);
  }

  /**
   * Transaction Details
   *
   * @throws FetchError<400, types.GetTransactionDetails1Response400> 400
   */
  getTransactionDetails1(metadata: types.GetTransactionDetails1MetadataParam): Promise<FetchResponse<200, types.GetTransactionDetails1Response200>> {
    return this.core.fetch('/v2/transaction/{transaction_id}', 'get', metadata);
  }

  /**
   * Account Transactions
   *
   * @throws FetchError<400, types.GResponse400> 400
   */
  g(metadata: types.GMetadataParam): Promise<FetchResponse<200, types.GResponse200>> {
    return this.core.fetch('/v2/transaction/account/{account_id}/all', 'get', metadata);
  }

  /**
   * Invoice From Hash
   *
   * @throws FetchError<400, types.InvoiceFromHashResponse400> 400
   * @throws FetchError<404, types.InvoiceFromHashResponse404> 404
   */
  invoiceFromHash(metadata: types.InvoiceFromHashMetadataParam): Promise<FetchResponse<200, types.InvoiceFromHashResponse200>> {
    return this.core.fetch('/invoice/from-hash/{invoice_hash}', 'get', metadata);
  }

  /**
   * Invoice From bolt11
   *
   * @throws FetchError<400, types.InvoiceFromBolt11Response400> 400
   * @throws FetchError<404, types.InvoiceFromBolt11Response404> 404
   */
  invoiceFromBolt11(metadata: types.InvoiceFromBolt11MetadataParam): Promise<FetchResponse<200, types.InvoiceFromBolt11Response200>> {
    return this.core.fetch('/invoice/from-bolt11/{bolt11}', 'get', metadata);
  }

  /**
   * Decoded on the LNURL string
   *
   * @summary Invoice requirements
   * @throws FetchError<400, types.InvoiceRequirementsResponse400> 400
   */
  invoiceRequirements(metadata: types.InvoiceRequirementsMetadataParam): Promise<FetchResponse<200, types.InvoiceRequirementsResponse200>> {
    return this.core.fetch('/lnurl/withdraw/invoice-requirements?k1={k1}', 'get', metadata);
  }

  /**
   * Callback function that asynchronously pays the invoice
   *
   * @summary Pay invoice
   * @throws FetchError<400, types.PayInvoice1Response400> 400
   */
  payInvoice1(metadata: types.PayInvoice1MetadataParam): Promise<FetchResponse<200, types.PayInvoice1Response200>> {
    return this.core.fetch('/lnurl/withdraw/invoice?k1={k1}&pr={pr}', 'get', metadata);
  }

  /**
   * Decoded on the LNURL string
   *
   * @summary Invoice requirements
   * @throws FetchError<400, types.InvoiceRequirements1Response400> 400
   */
  invoiceRequirements1(metadata: types.InvoiceRequirements1MetadataParam): Promise<FetchResponse<200, types.InvoiceRequirements1Response200>> {
    return this.core.fetch('/lnurl/pay/invoice-requirements?k1={k1}', 'get', metadata);
  }

  /**
   * Generates an invoice from the k1 or ln-address.
   *
   * @summary Bolt11
   * @throws FetchError<400, types.PayInvoice2Response400> 400
   */
  payInvoice2(metadata: types.PayInvoice2MetadataParam): Promise<FetchResponse<200, types.PayInvoice2Response200>> {
    return this.core.fetch('/lnurl/pay/invoice?amount={amount}&k1={k1}&comment={comment}', 'get', metadata);
  }

  /**
   * Checks the current charges, currency, and amount of an LNURL-pay
   *
   * @summary LNURL-pay status
   * @throws FetchError<400, types.GetLnurlPayStatusResponse400> 400
   * @throws FetchError<404, types.GetLnurlPayStatusResponse404> 404
   */
  getLnurlPayStatus(metadata: types.GetLnurlPayStatusMetadataParam): Promise<FetchResponse<200, types.GetLnurlPayStatusResponse200>> {
    return this.core.fetch('/lnurl/pay/{lnurl}', 'get', metadata);
  }

  /**
   * All LNURL-pay
   *
   * @throws FetchError<400, types.GetAllLnurlPayResponse400> 400
   * @throws FetchError<404, types.GetAllLnurlPayResponse404> 404
   */
  getAllLnurlPay(metadata: types.GetAllLnurlPayMetadataParam): Promise<FetchResponse<200, types.GetAllLnurlPayResponse200>> {
    return this.core.fetch('/lnurl/pay/all/{account}', 'get', metadata);
  }

  /**
   * **Get payment information using the hash.**
   *
   * @summary From hash
   * @throws FetchError<400, types.GetPaymentInfoFromHashResponse400> 400
   * @throws FetchError<404, types.GetPaymentInfoFromHashResponse404> 404
   */
  getPaymentInfoFromHash(metadata: types.GetPaymentInfoFromHashMetadataParam): Promise<FetchResponse<200, types.GetPaymentInfoFromHashResponse200>> {
    return this.core.fetch('/payment/from-hash/{hash}', 'get', metadata);
  }

  /**
   * Cancel Invoices
   *
   * @summary Delete Invoice From bolt11
   * @throws FetchError<400, types.InvoiceFromBolt111Response400> 400
   * @throws FetchError<404, types.InvoiceFromBolt111Response404> 404
   */
  invoiceFromBolt111(metadata: types.InvoiceFromBolt111MetadataParam): Promise<FetchResponse<200, types.InvoiceFromBolt111Response200>> {
    return this.core.fetch('/invoice/bolt11/{bolt11}', 'delete', metadata);
  }

  /**
   * Get split destinations available to the account
   *
   * @summary Get Split Destinations
   */
  getSplitDestination(metadata: types.GetSplitDestinationMetadataParam): Promise<FetchResponse<200, types.GetSplitDestinationResponse200>> {
    return this.core.fetch('/account/{account_id}/splits/destinations', 'get', metadata);
  }

  /**
   * Returns an array containing all the splits configured for the account
   *
   * @summary Get all Splits
   */
  getAllSplits(metadata: types.GetAllSplitsMetadataParam): Promise<FetchResponse<200, types.GetAllSplitsResponse200>> {
    return this.core.fetch('/account/{account_id}/splits', 'get', metadata);
  }

  /**
   * Updates a list of existing splits for the account
   *
   * @summary Update all Splits
   * @throws FetchError<400, types.GetAllSplitsCopyResponse400> 400
   * @throws FetchError<404, types.GetAllSplitsCopyResponse404> 404
   */
  getAllSplitsCopy(body: types.GetAllSplitsCopyBodyParam, metadata: types.GetAllSplitsCopyMetadataParam): Promise<FetchResponse<200, types.GetAllSplitsCopyResponse200>>;
  getAllSplitsCopy(metadata: types.GetAllSplitsCopyMetadataParam): Promise<FetchResponse<200, types.GetAllSplitsCopyResponse200>>;
  getAllSplitsCopy(body?: types.GetAllSplitsCopyBodyParam | types.GetAllSplitsCopyMetadataParam, metadata?: types.GetAllSplitsCopyMetadataParam): Promise<FetchResponse<200, types.GetAllSplitsCopyResponse200>> {
    return this.core.fetch('/account/{account_id}/splits', 'put', body, metadata);
  }

  /**
   * Delete all existing splits for the account
   *
   * @summary Delete all Splits
   */
  updateAllSplitsCopy1(metadata: types.UpdateAllSplitsCopy1MetadataParam): Promise<FetchResponse<200, types.UpdateAllSplitsCopy1Response200>> {
    return this.core.fetch('/account/{account_id}/splits', 'delete', metadata);
  }

  /**
   * Creates or adds additional splits for the account
   *
   * @summary Create Splits
   * @throws FetchError<400, types.UpdateAllSplitsCopy2Response400> 400
   * @throws FetchError<404, types.UpdateAllSplitsCopy2Response404> 404
   */
  updateAllSplitsCopy2(body: types.UpdateAllSplitsCopy2BodyParam, metadata: types.UpdateAllSplitsCopy2MetadataParam): Promise<FetchResponse<200, types.UpdateAllSplitsCopy2Response200>>;
  updateAllSplitsCopy2(metadata: types.UpdateAllSplitsCopy2MetadataParam): Promise<FetchResponse<200, types.UpdateAllSplitsCopy2Response200>>;
  updateAllSplitsCopy2(body?: types.UpdateAllSplitsCopy2BodyParam | types.UpdateAllSplitsCopy2MetadataParam, metadata?: types.UpdateAllSplitsCopy2MetadataParam): Promise<FetchResponse<200, types.UpdateAllSplitsCopy2Response200>> {
    return this.core.fetch('/account/{account_id}/splits', 'post', body, metadata);
  }

  /**
   * Returns the split requested with split ID
   *
   * @summary Get a single Split
   * @throws FetchError<400, types.GetASingleSplitResponse400> 400
   */
  getASingleSplit(metadata: types.GetASingleSplitMetadataParam): Promise<FetchResponse<200, types.GetASingleSplitResponse200>> {
    return this.core.fetch('/account/{account_id}/splits/{split_id}', 'get', metadata);
  }

  /**
   * Updates an existing split for the account
   *
   * @summary Update a single Split
   * @throws FetchError<400, types.UpdateAllSplitsCopyResponse400> 400
   * @throws FetchError<404, types.UpdateAllSplitsCopyResponse404> 404
   */
  updateAllSplitsCopy(body: types.UpdateAllSplitsCopyBodyParam, metadata: types.UpdateAllSplitsCopyMetadataParam): Promise<FetchResponse<200, types.UpdateAllSplitsCopyResponse200>> {
    return this.core.fetch('/account/{account_id}/splits/{split_id}', 'put', body, metadata);
  }

  /**
   * Delete an existing split for the account
   *
   * @summary Delete a single Split
   * @throws FetchError<400, types.UpdateASingleSplitCopyResponse400> 400
   */
  updateASingleSplitCopy(metadata: types.UpdateASingleSplitCopyMetadataParam): Promise<FetchResponse<200, types.UpdateASingleSplitCopyResponse200>> {
    return this.core.fetch('/account/{account_id}/splits/{split_id}', 'delete', metadata);
  }

  /**
   * **Get all IBEXHub accounts.**
   *
   * @summary All Accounts V2
   * @throws FetchError<400, types.GetAllAccountsCopyResponse400> 400
   * @throws FetchError<401, types.GetAllAccountsCopyResponse401> 401
   */
  getAllAccountsCopy(metadata?: types.GetAllAccountsCopyMetadataParam): Promise<FetchResponse<200, types.GetAllAccountsCopyResponse200>> {
    return this.core.fetch('/v2/account', 'get', metadata);
  }

  /**
   * Decode an LNURL to get a request url
   *
   * @summary Decode LNURL
   * @throws FetchError<400, types.DecodeLnurlResponse400> 400
   */
  decodeLnurl(metadata: types.DecodeLnurlMetadataParam): Promise<FetchResponse<200, types.DecodeLnurlResponse200>> {
    return this.core.fetch('/lnurl/decode/{lnurl}', 'get', metadata);
  }

  /**
   * Send sats to a bitcoin address.
   *
   * @summary Send to Address V2
   * @throws FetchError<400, types.SendToAddressCopyResponse400> 400
   * @throws FetchError<403, types.SendToAddressCopyResponse403> 403
   */
  sendToAddressCopy(body: types.SendToAddressCopyBodyParam): Promise<FetchResponse<200, types.SendToAddressCopyResponse200>> {
    return this.core.fetch('/v2/onchain/send', 'post', body);
  }

  /**
   * Estimate fee required to send sats to onchain address
   *
   * @summary Estimate Fee V2
   * @throws FetchError<400, types.EstimateFeeCopyResponse400> 400
   * @throws FetchError<404, types.EstimateFeeCopyResponse404> 404
   */
  estimateFeeCopy(metadata: types.EstimateFeeCopyMetadataParam): Promise<FetchResponse<200, types.EstimateFeeCopyResponse200>> {
    return this.core.fetch('/v2/onchain/estimate-fee?dest_address=&amount_sat= (COPY)', 'get', metadata);
  }

  /**
   * Generates an invoice from the ln-address.
   *
   * @summary Bolt11
   * @throws FetchError<400, types.FetchInvoiceCopyResponse400> 400
   */
  fetchInvoiceCopy(metadata: types.FetchInvoiceCopyMetadataParam): Promise<FetchResponse<200, types.FetchInvoiceCopyResponse200>> {
    return this.core.fetch('/lnurl/pay/invoice?amount={amount}&ln-address={ln-address}&comment={comment} (COPY)', 'get', metadata);
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { AddInvoiceBodyParam, AddInvoiceResponse201, AddInvoiceResponse400, AddInvoiceResponse403, AddInvoiceV1DepreciatedBodyParam, AddInvoiceV1DepreciatedResponse201, AddInvoiceV1DepreciatedResponse400, AddInvoiceV1DepreciatedResponse403, CancelALnurlWithdrawMetadataParam, CancelALnurlWithdrawResponse200, CancelALnurlWithdrawResponse400, CancelALnurlWithdrawResponse403, ChangePasswordBodyParam, ChangePasswordResponse204, ChangePasswordResponse400, ChangePasswordResponse401, ConfirmForgotPasswordBodyParam, ConfirmForgotPasswordResponse204, ConfirmForgotPasswordResponse400, ConfirmForgotPasswordResponse404, CreateALightningAddressBodyParam, CreateALightningAddressResponse201, CreateALightningAddressResponse400, CreateALightningAddressResponse403, CreateAccountBodyParam, CreateAccountResponse201, CreateAccountResponse400, CreateAccountResponse401, CreateLnurlPayBodyParam, CreateLnurlPayResponse201, CreateLnurlPayResponse400, CreateLnurlPayResponse403, CreateLnurlWithdrawBodyParam, CreateLnurlWithdrawResponse201, CreateLnurlWithdrawResponse400, CreateLnurlWithdrawResponse403, DecodeInvoiceMetadataParam, DecodeInvoiceResponse200, DecodeInvoiceResponse400, DecodeInvoiceResponse401, DecodeInvoiceResponse404, DecodeLnurlMetadataParam, DecodeLnurlResponse200, DecodeLnurlResponse400, DeleteLightningAddressMetadataParam, DeleteLightningAddressResponse204, DeleteLightningAddressResponse400, DeleteLightningAddressResponse403, EstimateFeeCopyMetadataParam, EstimateFeeCopyResponse200, EstimateFeeCopyResponse400, EstimateFeeCopyResponse404, EstimateFeeMetadataParam, EstimateFeeResponse200, EstimateFeeResponse400, EstimateFeeResponse404, FetchInvoiceCopyMetadataParam, FetchInvoiceCopyResponse200, FetchInvoiceCopyResponse400, ForgotPasswordBodyParam, ForgotPasswordResponse204, ForgotPasswordResponse400, ForgotPasswordResponse404, GMetadataParam, GResponse200, GResponse400, GenerateBitcoinAddressBodyParam, GenerateBitcoinAddressResponse201, GenerateBitcoinAddressResponse400, GenerateBitcoinAddressResponse403, GetASingleSplitMetadataParam, GetASingleSplitResponse200, GetASingleSplitResponse400, GetAccountDetailsMetadataParam, GetAccountDetailsResponse200, GetAccountDetailsResponse400, GetAccountDetailsResponse401, GetAccountDetailsResponse403, GetAllAccountsCopyMetadataParam, GetAllAccountsCopyResponse200, GetAllAccountsCopyResponse400, GetAllAccountsCopyResponse401, GetAllLightningAdressesMetadataParam, GetAllLightningAdressesResponse200, GetAllLightningAdressesResponse400, GetAllLightningAdressesResponse403, GetAllLnurlPayMetadataParam, GetAllLnurlPayResponse200, GetAllLnurlPayResponse400, GetAllLnurlPayResponse404, GetAllLnurlWithdrawsMetadataParam, GetAllLnurlWithdrawsResponse200, GetAllLnurlWithdrawsResponse400, GetAllResponse200, GetAllResponse400, GetAllSplitsCopyBodyParam, GetAllSplitsCopyMetadataParam, GetAllSplitsCopyResponse200, GetAllSplitsCopyResponse400, GetAllSplitsCopyResponse404, GetAllSplitsMetadataParam, GetAllSplitsResponse200, GetAllTheAccountsOfTheUserResponse200, GetAllTheAccountsOfTheUserResponse400, GetAllTheAccountsOfTheUserResponse401, GetFeeEstimationMetadataParam, GetFeeEstimationResponse200, GetFeeEstimationResponse400, GetFeeEstimationResponse404, GetLnurlPayStatusMetadataParam, GetLnurlPayStatusResponse200, GetLnurlPayStatusResponse400, GetLnurlPayStatusResponse404, GetLnurlWithdrawStatusMetadataParam, GetLnurlWithdrawStatusResponse200, GetLnurlWithdrawStatusResponse400, GetLnurlWithdrawStatusResponse404, GetPaymentInfoFromHashMetadataParam, GetPaymentInfoFromHashResponse200, GetPaymentInfoFromHashResponse400, GetPaymentInfoFromHashResponse404, GetPaymentInfosFromBolt11MetadataParam, GetPaymentInfosFromBolt11Response200, GetPaymentInfosFromBolt11Response400, GetPaymentInfosFromBolt11Response404, GetRatesMetadataParam, GetRatesResponse200, GetRatesResponse400, GetRatesV2MetadataParam, GetRatesV2Response200, GetSplitDestinationMetadataParam, GetSplitDestinationResponse200, GetTransactionDetails1MetadataParam, GetTransactionDetails1Response200, GetTransactionDetails1Response400, InvoiceFromBolt111MetadataParam, InvoiceFromBolt111Response200, InvoiceFromBolt111Response400, InvoiceFromBolt111Response404, InvoiceFromBolt11MetadataParam, InvoiceFromBolt11Response200, InvoiceFromBolt11Response400, InvoiceFromBolt11Response404, InvoiceFromHashMetadataParam, InvoiceFromHashResponse200, InvoiceFromHashResponse400, InvoiceFromHashResponse404, InvoiceRequirements1MetadataParam, InvoiceRequirements1Response200, InvoiceRequirements1Response400, InvoiceRequirementsMetadataParam, InvoiceRequirementsResponse200, InvoiceRequirementsResponse400, PayInvoice1MetadataParam, PayInvoice1Response200, PayInvoice1Response400, PayInvoice2MetadataParam, PayInvoice2Response200, PayInvoice2Response400, PayInvoiceBodyParam, PayInvoiceResponse200, PayInvoiceResponse400, PayInvoiceResponse403, PayInvoiceResponse404, PayInvoiceResponse422, PayInvoiceResponse504, PayInvoiceV2BodyParam, PayInvoiceV2Response200, PayInvoiceV2Response400, PayInvoiceV2Response403, PayInvoiceV2Response404, PayInvoiceV2Response422, PayInvoiceV2Response504, PayToALnurlPayBodyParam, PayToALnurlPayResponse201, PayToALnurlPayResponse400, PayToALnurlPayResponse403, RefreshAccessTokenBodyParam, RefreshAccessTokenResponse200, RefreshAccessTokenResponse400, RevokeRefreshTokenBodyParam, RevokeRefreshTokenResponse204, RevokeRefreshTokenResponse400, SendToAddressBodyParam, SendToAddressCopyBodyParam, SendToAddressCopyResponse200, SendToAddressCopyResponse400, SendToAddressCopyResponse403, SendToAddressResponse200, SendToAddressResponse400, SendToAddressResponse403, SignInBodyParam, SignInResponse200, SignInResponse400, SignUpBodyParam, SignUpResponse200, SignUpResponse400, UpdateASingleSplitCopyMetadataParam, UpdateASingleSplitCopyResponse200, UpdateASingleSplitCopyResponse400, UpdateAccountBodyParam, UpdateAccountMetadataParam, UpdateAccountResponse200, UpdateAccountResponse400, UpdateAccountResponse401, UpdateAccountResponse403, UpdateAllSplitsCopy1MetadataParam, UpdateAllSplitsCopy1Response200, UpdateAllSplitsCopy2BodyParam, UpdateAllSplitsCopy2MetadataParam, UpdateAllSplitsCopy2Response200, UpdateAllSplitsCopy2Response400, UpdateAllSplitsCopy2Response404, UpdateAllSplitsCopyBodyParam, UpdateAllSplitsCopyMetadataParam, UpdateAllSplitsCopyResponse200, UpdateAllSplitsCopyResponse400, UpdateAllSplitsCopyResponse404, UpdateLightningAddressBodyParam, UpdateLightningAddressMetadataParam, UpdateLightningAddressResponse200, UpdateLightningAddressResponse400, UpdateLightningAddressResponse403, WithdrawFromALnurlWithdrawBodyParam, WithdrawFromALnurlWithdrawMetadataParam, WithdrawFromALnurlWithdrawResponse200, WithdrawFromALnurlWithdrawResponse400, WithdrawFromALnurlWithdrawResponse403 } from './types';
