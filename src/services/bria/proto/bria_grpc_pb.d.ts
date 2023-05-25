// package: services.bria.v1
// file: bria.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as bria_pb from "./bria_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

interface IBriaServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createProfile: IBriaServiceService_ICreateProfile;
    listProfiles: IBriaServiceService_IListProfiles;
    createProfileApiKey: IBriaServiceService_ICreateProfileApiKey;
    importXpub: IBriaServiceService_IImportXpub;
    listXpubs: IBriaServiceService_IListXpubs;
    setSignerConfig: IBriaServiceService_ISetSignerConfig;
    createWallet: IBriaServiceService_ICreateWallet;
    listWallets: IBriaServiceService_IListWallets;
    getWalletBalanceSummary: IBriaServiceService_IGetWalletBalanceSummary;
    getAccountBalanceSummary: IBriaServiceService_IGetAccountBalanceSummary;
    newAddress: IBriaServiceService_INewAddress;
    updateAddress: IBriaServiceService_IUpdateAddress;
    listAddresses: IBriaServiceService_IListAddresses;
    listUtxos: IBriaServiceService_IListUtxos;
    createPayoutQueue: IBriaServiceService_ICreatePayoutQueue;
    listPayoutQueues: IBriaServiceService_IListPayoutQueues;
    updatePayoutQueue: IBriaServiceService_IUpdatePayoutQueue;
    submitPayout: IBriaServiceService_ISubmitPayout;
    estimatePayoutFee: IBriaServiceService_IEstimatePayoutFee;
    listPayouts: IBriaServiceService_IListPayouts;
    listSigningSessions: IBriaServiceService_IListSigningSessions;
    subscribeAll: IBriaServiceService_ISubscribeAll;
}

interface IBriaServiceService_ICreateProfile extends grpc.MethodDefinition<bria_pb.CreateProfileRequest, bria_pb.CreateProfileResponse> {
    path: "/services.bria.v1.BriaService/CreateProfile";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.CreateProfileRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.CreateProfileRequest>;
    responseSerialize: grpc.serialize<bria_pb.CreateProfileResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.CreateProfileResponse>;
}
interface IBriaServiceService_IListProfiles extends grpc.MethodDefinition<bria_pb.ListProfilesRequest, bria_pb.ListProfilesResponse> {
    path: "/services.bria.v1.BriaService/ListProfiles";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.ListProfilesRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.ListProfilesRequest>;
    responseSerialize: grpc.serialize<bria_pb.ListProfilesResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.ListProfilesResponse>;
}
interface IBriaServiceService_ICreateProfileApiKey extends grpc.MethodDefinition<bria_pb.CreateProfileApiKeyRequest, bria_pb.CreateProfileApiKeyResponse> {
    path: "/services.bria.v1.BriaService/CreateProfileApiKey";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.CreateProfileApiKeyRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.CreateProfileApiKeyRequest>;
    responseSerialize: grpc.serialize<bria_pb.CreateProfileApiKeyResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.CreateProfileApiKeyResponse>;
}
interface IBriaServiceService_IImportXpub extends grpc.MethodDefinition<bria_pb.ImportXpubRequest, bria_pb.ImportXpubResponse> {
    path: "/services.bria.v1.BriaService/ImportXpub";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.ImportXpubRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.ImportXpubRequest>;
    responseSerialize: grpc.serialize<bria_pb.ImportXpubResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.ImportXpubResponse>;
}
interface IBriaServiceService_IListXpubs extends grpc.MethodDefinition<bria_pb.ListXpubsRequest, bria_pb.ListXpubsResponse> {
    path: "/services.bria.v1.BriaService/ListXpubs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.ListXpubsRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.ListXpubsRequest>;
    responseSerialize: grpc.serialize<bria_pb.ListXpubsResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.ListXpubsResponse>;
}
interface IBriaServiceService_ISetSignerConfig extends grpc.MethodDefinition<bria_pb.SetSignerConfigRequest, bria_pb.SetSignerConfigResponse> {
    path: "/services.bria.v1.BriaService/SetSignerConfig";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.SetSignerConfigRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.SetSignerConfigRequest>;
    responseSerialize: grpc.serialize<bria_pb.SetSignerConfigResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.SetSignerConfigResponse>;
}
interface IBriaServiceService_ICreateWallet extends grpc.MethodDefinition<bria_pb.CreateWalletRequest, bria_pb.CreateWalletResponse> {
    path: "/services.bria.v1.BriaService/CreateWallet";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.CreateWalletRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.CreateWalletRequest>;
    responseSerialize: grpc.serialize<bria_pb.CreateWalletResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.CreateWalletResponse>;
}
interface IBriaServiceService_IListWallets extends grpc.MethodDefinition<bria_pb.ListWalletsRequest, bria_pb.ListWalletsResponse> {
    path: "/services.bria.v1.BriaService/ListWallets";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.ListWalletsRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.ListWalletsRequest>;
    responseSerialize: grpc.serialize<bria_pb.ListWalletsResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.ListWalletsResponse>;
}
interface IBriaServiceService_IGetWalletBalanceSummary extends grpc.MethodDefinition<bria_pb.GetWalletBalanceSummaryRequest, bria_pb.GetWalletBalanceSummaryResponse> {
    path: "/services.bria.v1.BriaService/GetWalletBalanceSummary";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.GetWalletBalanceSummaryRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.GetWalletBalanceSummaryRequest>;
    responseSerialize: grpc.serialize<bria_pb.GetWalletBalanceSummaryResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.GetWalletBalanceSummaryResponse>;
}
interface IBriaServiceService_IGetAccountBalanceSummary extends grpc.MethodDefinition<bria_pb.GetAccountBalanceSummaryRequest, bria_pb.GetAccountBalanceSummaryResponse> {
    path: "/services.bria.v1.BriaService/GetAccountBalanceSummary";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.GetAccountBalanceSummaryRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.GetAccountBalanceSummaryRequest>;
    responseSerialize: grpc.serialize<bria_pb.GetAccountBalanceSummaryResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.GetAccountBalanceSummaryResponse>;
}
interface IBriaServiceService_INewAddress extends grpc.MethodDefinition<bria_pb.NewAddressRequest, bria_pb.NewAddressResponse> {
    path: "/services.bria.v1.BriaService/NewAddress";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.NewAddressRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.NewAddressRequest>;
    responseSerialize: grpc.serialize<bria_pb.NewAddressResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.NewAddressResponse>;
}
interface IBriaServiceService_IUpdateAddress extends grpc.MethodDefinition<bria_pb.UpdateAddressRequest, bria_pb.UpdateAddressResponse> {
    path: "/services.bria.v1.BriaService/UpdateAddress";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.UpdateAddressRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.UpdateAddressRequest>;
    responseSerialize: grpc.serialize<bria_pb.UpdateAddressResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.UpdateAddressResponse>;
}
interface IBriaServiceService_IListAddresses extends grpc.MethodDefinition<bria_pb.ListAddressesRequest, bria_pb.ListAddressesResponse> {
    path: "/services.bria.v1.BriaService/ListAddresses";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.ListAddressesRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.ListAddressesRequest>;
    responseSerialize: grpc.serialize<bria_pb.ListAddressesResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.ListAddressesResponse>;
}
interface IBriaServiceService_IListUtxos extends grpc.MethodDefinition<bria_pb.ListUtxosRequest, bria_pb.ListUtxosResponse> {
    path: "/services.bria.v1.BriaService/ListUtxos";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.ListUtxosRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.ListUtxosRequest>;
    responseSerialize: grpc.serialize<bria_pb.ListUtxosResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.ListUtxosResponse>;
}
interface IBriaServiceService_ICreatePayoutQueue extends grpc.MethodDefinition<bria_pb.CreatePayoutQueueRequest, bria_pb.CreatePayoutQueueResponse> {
    path: "/services.bria.v1.BriaService/CreatePayoutQueue";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.CreatePayoutQueueRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.CreatePayoutQueueRequest>;
    responseSerialize: grpc.serialize<bria_pb.CreatePayoutQueueResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.CreatePayoutQueueResponse>;
}
interface IBriaServiceService_IListPayoutQueues extends grpc.MethodDefinition<bria_pb.ListPayoutQueuesRequest, bria_pb.ListPayoutQueuesResponse> {
    path: "/services.bria.v1.BriaService/ListPayoutQueues";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.ListPayoutQueuesRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.ListPayoutQueuesRequest>;
    responseSerialize: grpc.serialize<bria_pb.ListPayoutQueuesResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.ListPayoutQueuesResponse>;
}
interface IBriaServiceService_IUpdatePayoutQueue extends grpc.MethodDefinition<bria_pb.UpdatePayoutQueueRequest, bria_pb.UpdatePayoutQueueResponse> {
    path: "/services.bria.v1.BriaService/UpdatePayoutQueue";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.UpdatePayoutQueueRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.UpdatePayoutQueueRequest>;
    responseSerialize: grpc.serialize<bria_pb.UpdatePayoutQueueResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.UpdatePayoutQueueResponse>;
}
interface IBriaServiceService_ISubmitPayout extends grpc.MethodDefinition<bria_pb.SubmitPayoutRequest, bria_pb.SubmitPayoutResponse> {
    path: "/services.bria.v1.BriaService/SubmitPayout";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.SubmitPayoutRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.SubmitPayoutRequest>;
    responseSerialize: grpc.serialize<bria_pb.SubmitPayoutResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.SubmitPayoutResponse>;
}
interface IBriaServiceService_IEstimatePayoutFee extends grpc.MethodDefinition<bria_pb.EstimatePayoutFeeRequest, bria_pb.EstimatePayoutFeeResponse> {
    path: "/services.bria.v1.BriaService/EstimatePayoutFee";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.EstimatePayoutFeeRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.EstimatePayoutFeeRequest>;
    responseSerialize: grpc.serialize<bria_pb.EstimatePayoutFeeResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.EstimatePayoutFeeResponse>;
}
interface IBriaServiceService_IListPayouts extends grpc.MethodDefinition<bria_pb.ListPayoutsRequest, bria_pb.ListPayoutsResponse> {
    path: "/services.bria.v1.BriaService/ListPayouts";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.ListPayoutsRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.ListPayoutsRequest>;
    responseSerialize: grpc.serialize<bria_pb.ListPayoutsResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.ListPayoutsResponse>;
}
interface IBriaServiceService_IListSigningSessions extends grpc.MethodDefinition<bria_pb.ListSigningSessionsRequest, bria_pb.ListSigningSessionsResponse> {
    path: "/services.bria.v1.BriaService/ListSigningSessions";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bria_pb.ListSigningSessionsRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.ListSigningSessionsRequest>;
    responseSerialize: grpc.serialize<bria_pb.ListSigningSessionsResponse>;
    responseDeserialize: grpc.deserialize<bria_pb.ListSigningSessionsResponse>;
}
interface IBriaServiceService_ISubscribeAll extends grpc.MethodDefinition<bria_pb.SubscribeAllRequest, bria_pb.BriaEvent> {
    path: "/services.bria.v1.BriaService/SubscribeAll";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<bria_pb.SubscribeAllRequest>;
    requestDeserialize: grpc.deserialize<bria_pb.SubscribeAllRequest>;
    responseSerialize: grpc.serialize<bria_pb.BriaEvent>;
    responseDeserialize: grpc.deserialize<bria_pb.BriaEvent>;
}

export const BriaServiceService: IBriaServiceService;

export interface IBriaServiceServer extends grpc.UntypedServiceImplementation {
    createProfile: grpc.handleUnaryCall<bria_pb.CreateProfileRequest, bria_pb.CreateProfileResponse>;
    listProfiles: grpc.handleUnaryCall<bria_pb.ListProfilesRequest, bria_pb.ListProfilesResponse>;
    createProfileApiKey: grpc.handleUnaryCall<bria_pb.CreateProfileApiKeyRequest, bria_pb.CreateProfileApiKeyResponse>;
    importXpub: grpc.handleUnaryCall<bria_pb.ImportXpubRequest, bria_pb.ImportXpubResponse>;
    listXpubs: grpc.handleUnaryCall<bria_pb.ListXpubsRequest, bria_pb.ListXpubsResponse>;
    setSignerConfig: grpc.handleUnaryCall<bria_pb.SetSignerConfigRequest, bria_pb.SetSignerConfigResponse>;
    createWallet: grpc.handleUnaryCall<bria_pb.CreateWalletRequest, bria_pb.CreateWalletResponse>;
    listWallets: grpc.handleUnaryCall<bria_pb.ListWalletsRequest, bria_pb.ListWalletsResponse>;
    getWalletBalanceSummary: grpc.handleUnaryCall<bria_pb.GetWalletBalanceSummaryRequest, bria_pb.GetWalletBalanceSummaryResponse>;
    getAccountBalanceSummary: grpc.handleUnaryCall<bria_pb.GetAccountBalanceSummaryRequest, bria_pb.GetAccountBalanceSummaryResponse>;
    newAddress: grpc.handleUnaryCall<bria_pb.NewAddressRequest, bria_pb.NewAddressResponse>;
    updateAddress: grpc.handleUnaryCall<bria_pb.UpdateAddressRequest, bria_pb.UpdateAddressResponse>;
    listAddresses: grpc.handleUnaryCall<bria_pb.ListAddressesRequest, bria_pb.ListAddressesResponse>;
    listUtxos: grpc.handleUnaryCall<bria_pb.ListUtxosRequest, bria_pb.ListUtxosResponse>;
    createPayoutQueue: grpc.handleUnaryCall<bria_pb.CreatePayoutQueueRequest, bria_pb.CreatePayoutQueueResponse>;
    listPayoutQueues: grpc.handleUnaryCall<bria_pb.ListPayoutQueuesRequest, bria_pb.ListPayoutQueuesResponse>;
    updatePayoutQueue: grpc.handleUnaryCall<bria_pb.UpdatePayoutQueueRequest, bria_pb.UpdatePayoutQueueResponse>;
    submitPayout: grpc.handleUnaryCall<bria_pb.SubmitPayoutRequest, bria_pb.SubmitPayoutResponse>;
    estimatePayoutFee: grpc.handleUnaryCall<bria_pb.EstimatePayoutFeeRequest, bria_pb.EstimatePayoutFeeResponse>;
    listPayouts: grpc.handleUnaryCall<bria_pb.ListPayoutsRequest, bria_pb.ListPayoutsResponse>;
    listSigningSessions: grpc.handleUnaryCall<bria_pb.ListSigningSessionsRequest, bria_pb.ListSigningSessionsResponse>;
    subscribeAll: grpc.handleServerStreamingCall<bria_pb.SubscribeAllRequest, bria_pb.BriaEvent>;
}

export interface IBriaServiceClient {
    createProfile(request: bria_pb.CreateProfileRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateProfileResponse) => void): grpc.ClientUnaryCall;
    createProfile(request: bria_pb.CreateProfileRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateProfileResponse) => void): grpc.ClientUnaryCall;
    createProfile(request: bria_pb.CreateProfileRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateProfileResponse) => void): grpc.ClientUnaryCall;
    listProfiles(request: bria_pb.ListProfilesRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListProfilesResponse) => void): grpc.ClientUnaryCall;
    listProfiles(request: bria_pb.ListProfilesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListProfilesResponse) => void): grpc.ClientUnaryCall;
    listProfiles(request: bria_pb.ListProfilesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListProfilesResponse) => void): grpc.ClientUnaryCall;
    createProfileApiKey(request: bria_pb.CreateProfileApiKeyRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateProfileApiKeyResponse) => void): grpc.ClientUnaryCall;
    createProfileApiKey(request: bria_pb.CreateProfileApiKeyRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateProfileApiKeyResponse) => void): grpc.ClientUnaryCall;
    createProfileApiKey(request: bria_pb.CreateProfileApiKeyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateProfileApiKeyResponse) => void): grpc.ClientUnaryCall;
    importXpub(request: bria_pb.ImportXpubRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ImportXpubResponse) => void): grpc.ClientUnaryCall;
    importXpub(request: bria_pb.ImportXpubRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ImportXpubResponse) => void): grpc.ClientUnaryCall;
    importXpub(request: bria_pb.ImportXpubRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ImportXpubResponse) => void): grpc.ClientUnaryCall;
    listXpubs(request: bria_pb.ListXpubsRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListXpubsResponse) => void): grpc.ClientUnaryCall;
    listXpubs(request: bria_pb.ListXpubsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListXpubsResponse) => void): grpc.ClientUnaryCall;
    listXpubs(request: bria_pb.ListXpubsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListXpubsResponse) => void): grpc.ClientUnaryCall;
    setSignerConfig(request: bria_pb.SetSignerConfigRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.SetSignerConfigResponse) => void): grpc.ClientUnaryCall;
    setSignerConfig(request: bria_pb.SetSignerConfigRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.SetSignerConfigResponse) => void): grpc.ClientUnaryCall;
    setSignerConfig(request: bria_pb.SetSignerConfigRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.SetSignerConfigResponse) => void): grpc.ClientUnaryCall;
    createWallet(request: bria_pb.CreateWalletRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateWalletResponse) => void): grpc.ClientUnaryCall;
    createWallet(request: bria_pb.CreateWalletRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateWalletResponse) => void): grpc.ClientUnaryCall;
    createWallet(request: bria_pb.CreateWalletRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateWalletResponse) => void): grpc.ClientUnaryCall;
    listWallets(request: bria_pb.ListWalletsRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListWalletsResponse) => void): grpc.ClientUnaryCall;
    listWallets(request: bria_pb.ListWalletsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListWalletsResponse) => void): grpc.ClientUnaryCall;
    listWallets(request: bria_pb.ListWalletsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListWalletsResponse) => void): grpc.ClientUnaryCall;
    getWalletBalanceSummary(request: bria_pb.GetWalletBalanceSummaryRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.GetWalletBalanceSummaryResponse) => void): grpc.ClientUnaryCall;
    getWalletBalanceSummary(request: bria_pb.GetWalletBalanceSummaryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.GetWalletBalanceSummaryResponse) => void): grpc.ClientUnaryCall;
    getWalletBalanceSummary(request: bria_pb.GetWalletBalanceSummaryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.GetWalletBalanceSummaryResponse) => void): grpc.ClientUnaryCall;
    getAccountBalanceSummary(request: bria_pb.GetAccountBalanceSummaryRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.GetAccountBalanceSummaryResponse) => void): grpc.ClientUnaryCall;
    getAccountBalanceSummary(request: bria_pb.GetAccountBalanceSummaryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.GetAccountBalanceSummaryResponse) => void): grpc.ClientUnaryCall;
    getAccountBalanceSummary(request: bria_pb.GetAccountBalanceSummaryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.GetAccountBalanceSummaryResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: bria_pb.NewAddressRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: bria_pb.NewAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: bria_pb.NewAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    updateAddress(request: bria_pb.UpdateAddressRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.UpdateAddressResponse) => void): grpc.ClientUnaryCall;
    updateAddress(request: bria_pb.UpdateAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.UpdateAddressResponse) => void): grpc.ClientUnaryCall;
    updateAddress(request: bria_pb.UpdateAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.UpdateAddressResponse) => void): grpc.ClientUnaryCall;
    listAddresses(request: bria_pb.ListAddressesRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListAddressesResponse) => void): grpc.ClientUnaryCall;
    listAddresses(request: bria_pb.ListAddressesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListAddressesResponse) => void): grpc.ClientUnaryCall;
    listAddresses(request: bria_pb.ListAddressesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListAddressesResponse) => void): grpc.ClientUnaryCall;
    listUtxos(request: bria_pb.ListUtxosRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListUtxosResponse) => void): grpc.ClientUnaryCall;
    listUtxos(request: bria_pb.ListUtxosRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListUtxosResponse) => void): grpc.ClientUnaryCall;
    listUtxos(request: bria_pb.ListUtxosRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListUtxosResponse) => void): grpc.ClientUnaryCall;
    createPayoutQueue(request: bria_pb.CreatePayoutQueueRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.CreatePayoutQueueResponse) => void): grpc.ClientUnaryCall;
    createPayoutQueue(request: bria_pb.CreatePayoutQueueRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.CreatePayoutQueueResponse) => void): grpc.ClientUnaryCall;
    createPayoutQueue(request: bria_pb.CreatePayoutQueueRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.CreatePayoutQueueResponse) => void): grpc.ClientUnaryCall;
    listPayoutQueues(request: bria_pb.ListPayoutQueuesRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListPayoutQueuesResponse) => void): grpc.ClientUnaryCall;
    listPayoutQueues(request: bria_pb.ListPayoutQueuesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListPayoutQueuesResponse) => void): grpc.ClientUnaryCall;
    listPayoutQueues(request: bria_pb.ListPayoutQueuesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListPayoutQueuesResponse) => void): grpc.ClientUnaryCall;
    updatePayoutQueue(request: bria_pb.UpdatePayoutQueueRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.UpdatePayoutQueueResponse) => void): grpc.ClientUnaryCall;
    updatePayoutQueue(request: bria_pb.UpdatePayoutQueueRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.UpdatePayoutQueueResponse) => void): grpc.ClientUnaryCall;
    updatePayoutQueue(request: bria_pb.UpdatePayoutQueueRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.UpdatePayoutQueueResponse) => void): grpc.ClientUnaryCall;
    submitPayout(request: bria_pb.SubmitPayoutRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.SubmitPayoutResponse) => void): grpc.ClientUnaryCall;
    submitPayout(request: bria_pb.SubmitPayoutRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.SubmitPayoutResponse) => void): grpc.ClientUnaryCall;
    submitPayout(request: bria_pb.SubmitPayoutRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.SubmitPayoutResponse) => void): grpc.ClientUnaryCall;
    estimatePayoutFee(request: bria_pb.EstimatePayoutFeeRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.EstimatePayoutFeeResponse) => void): grpc.ClientUnaryCall;
    estimatePayoutFee(request: bria_pb.EstimatePayoutFeeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.EstimatePayoutFeeResponse) => void): grpc.ClientUnaryCall;
    estimatePayoutFee(request: bria_pb.EstimatePayoutFeeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.EstimatePayoutFeeResponse) => void): grpc.ClientUnaryCall;
    listPayouts(request: bria_pb.ListPayoutsRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListPayoutsResponse) => void): grpc.ClientUnaryCall;
    listPayouts(request: bria_pb.ListPayoutsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListPayoutsResponse) => void): grpc.ClientUnaryCall;
    listPayouts(request: bria_pb.ListPayoutsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListPayoutsResponse) => void): grpc.ClientUnaryCall;
    listSigningSessions(request: bria_pb.ListSigningSessionsRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListSigningSessionsResponse) => void): grpc.ClientUnaryCall;
    listSigningSessions(request: bria_pb.ListSigningSessionsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListSigningSessionsResponse) => void): grpc.ClientUnaryCall;
    listSigningSessions(request: bria_pb.ListSigningSessionsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListSigningSessionsResponse) => void): grpc.ClientUnaryCall;
    subscribeAll(request: bria_pb.SubscribeAllRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<bria_pb.BriaEvent>;
    subscribeAll(request: bria_pb.SubscribeAllRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<bria_pb.BriaEvent>;
}

export class BriaServiceClient extends grpc.Client implements IBriaServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createProfile(request: bria_pb.CreateProfileRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateProfileResponse) => void): grpc.ClientUnaryCall;
    public createProfile(request: bria_pb.CreateProfileRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateProfileResponse) => void): grpc.ClientUnaryCall;
    public createProfile(request: bria_pb.CreateProfileRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateProfileResponse) => void): grpc.ClientUnaryCall;
    public listProfiles(request: bria_pb.ListProfilesRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListProfilesResponse) => void): grpc.ClientUnaryCall;
    public listProfiles(request: bria_pb.ListProfilesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListProfilesResponse) => void): grpc.ClientUnaryCall;
    public listProfiles(request: bria_pb.ListProfilesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListProfilesResponse) => void): grpc.ClientUnaryCall;
    public createProfileApiKey(request: bria_pb.CreateProfileApiKeyRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateProfileApiKeyResponse) => void): grpc.ClientUnaryCall;
    public createProfileApiKey(request: bria_pb.CreateProfileApiKeyRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateProfileApiKeyResponse) => void): grpc.ClientUnaryCall;
    public createProfileApiKey(request: bria_pb.CreateProfileApiKeyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateProfileApiKeyResponse) => void): grpc.ClientUnaryCall;
    public importXpub(request: bria_pb.ImportXpubRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ImportXpubResponse) => void): grpc.ClientUnaryCall;
    public importXpub(request: bria_pb.ImportXpubRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ImportXpubResponse) => void): grpc.ClientUnaryCall;
    public importXpub(request: bria_pb.ImportXpubRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ImportXpubResponse) => void): grpc.ClientUnaryCall;
    public listXpubs(request: bria_pb.ListXpubsRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListXpubsResponse) => void): grpc.ClientUnaryCall;
    public listXpubs(request: bria_pb.ListXpubsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListXpubsResponse) => void): grpc.ClientUnaryCall;
    public listXpubs(request: bria_pb.ListXpubsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListXpubsResponse) => void): grpc.ClientUnaryCall;
    public setSignerConfig(request: bria_pb.SetSignerConfigRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.SetSignerConfigResponse) => void): grpc.ClientUnaryCall;
    public setSignerConfig(request: bria_pb.SetSignerConfigRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.SetSignerConfigResponse) => void): grpc.ClientUnaryCall;
    public setSignerConfig(request: bria_pb.SetSignerConfigRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.SetSignerConfigResponse) => void): grpc.ClientUnaryCall;
    public createWallet(request: bria_pb.CreateWalletRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateWalletResponse) => void): grpc.ClientUnaryCall;
    public createWallet(request: bria_pb.CreateWalletRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateWalletResponse) => void): grpc.ClientUnaryCall;
    public createWallet(request: bria_pb.CreateWalletRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.CreateWalletResponse) => void): grpc.ClientUnaryCall;
    public listWallets(request: bria_pb.ListWalletsRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListWalletsResponse) => void): grpc.ClientUnaryCall;
    public listWallets(request: bria_pb.ListWalletsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListWalletsResponse) => void): grpc.ClientUnaryCall;
    public listWallets(request: bria_pb.ListWalletsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListWalletsResponse) => void): grpc.ClientUnaryCall;
    public getWalletBalanceSummary(request: bria_pb.GetWalletBalanceSummaryRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.GetWalletBalanceSummaryResponse) => void): grpc.ClientUnaryCall;
    public getWalletBalanceSummary(request: bria_pb.GetWalletBalanceSummaryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.GetWalletBalanceSummaryResponse) => void): grpc.ClientUnaryCall;
    public getWalletBalanceSummary(request: bria_pb.GetWalletBalanceSummaryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.GetWalletBalanceSummaryResponse) => void): grpc.ClientUnaryCall;
    public getAccountBalanceSummary(request: bria_pb.GetAccountBalanceSummaryRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.GetAccountBalanceSummaryResponse) => void): grpc.ClientUnaryCall;
    public getAccountBalanceSummary(request: bria_pb.GetAccountBalanceSummaryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.GetAccountBalanceSummaryResponse) => void): grpc.ClientUnaryCall;
    public getAccountBalanceSummary(request: bria_pb.GetAccountBalanceSummaryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.GetAccountBalanceSummaryResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: bria_pb.NewAddressRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: bria_pb.NewAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: bria_pb.NewAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public updateAddress(request: bria_pb.UpdateAddressRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.UpdateAddressResponse) => void): grpc.ClientUnaryCall;
    public updateAddress(request: bria_pb.UpdateAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.UpdateAddressResponse) => void): grpc.ClientUnaryCall;
    public updateAddress(request: bria_pb.UpdateAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.UpdateAddressResponse) => void): grpc.ClientUnaryCall;
    public listAddresses(request: bria_pb.ListAddressesRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListAddressesResponse) => void): grpc.ClientUnaryCall;
    public listAddresses(request: bria_pb.ListAddressesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListAddressesResponse) => void): grpc.ClientUnaryCall;
    public listAddresses(request: bria_pb.ListAddressesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListAddressesResponse) => void): grpc.ClientUnaryCall;
    public listUtxos(request: bria_pb.ListUtxosRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListUtxosResponse) => void): grpc.ClientUnaryCall;
    public listUtxos(request: bria_pb.ListUtxosRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListUtxosResponse) => void): grpc.ClientUnaryCall;
    public listUtxos(request: bria_pb.ListUtxosRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListUtxosResponse) => void): grpc.ClientUnaryCall;
    public createPayoutQueue(request: bria_pb.CreatePayoutQueueRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.CreatePayoutQueueResponse) => void): grpc.ClientUnaryCall;
    public createPayoutQueue(request: bria_pb.CreatePayoutQueueRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.CreatePayoutQueueResponse) => void): grpc.ClientUnaryCall;
    public createPayoutQueue(request: bria_pb.CreatePayoutQueueRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.CreatePayoutQueueResponse) => void): grpc.ClientUnaryCall;
    public listPayoutQueues(request: bria_pb.ListPayoutQueuesRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListPayoutQueuesResponse) => void): grpc.ClientUnaryCall;
    public listPayoutQueues(request: bria_pb.ListPayoutQueuesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListPayoutQueuesResponse) => void): grpc.ClientUnaryCall;
    public listPayoutQueues(request: bria_pb.ListPayoutQueuesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListPayoutQueuesResponse) => void): grpc.ClientUnaryCall;
    public updatePayoutQueue(request: bria_pb.UpdatePayoutQueueRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.UpdatePayoutQueueResponse) => void): grpc.ClientUnaryCall;
    public updatePayoutQueue(request: bria_pb.UpdatePayoutQueueRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.UpdatePayoutQueueResponse) => void): grpc.ClientUnaryCall;
    public updatePayoutQueue(request: bria_pb.UpdatePayoutQueueRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.UpdatePayoutQueueResponse) => void): grpc.ClientUnaryCall;
    public submitPayout(request: bria_pb.SubmitPayoutRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.SubmitPayoutResponse) => void): grpc.ClientUnaryCall;
    public submitPayout(request: bria_pb.SubmitPayoutRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.SubmitPayoutResponse) => void): grpc.ClientUnaryCall;
    public submitPayout(request: bria_pb.SubmitPayoutRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.SubmitPayoutResponse) => void): grpc.ClientUnaryCall;
    public estimatePayoutFee(request: bria_pb.EstimatePayoutFeeRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.EstimatePayoutFeeResponse) => void): grpc.ClientUnaryCall;
    public estimatePayoutFee(request: bria_pb.EstimatePayoutFeeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.EstimatePayoutFeeResponse) => void): grpc.ClientUnaryCall;
    public estimatePayoutFee(request: bria_pb.EstimatePayoutFeeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.EstimatePayoutFeeResponse) => void): grpc.ClientUnaryCall;
    public listPayouts(request: bria_pb.ListPayoutsRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListPayoutsResponse) => void): grpc.ClientUnaryCall;
    public listPayouts(request: bria_pb.ListPayoutsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListPayoutsResponse) => void): grpc.ClientUnaryCall;
    public listPayouts(request: bria_pb.ListPayoutsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListPayoutsResponse) => void): grpc.ClientUnaryCall;
    public listSigningSessions(request: bria_pb.ListSigningSessionsRequest, callback: (error: grpc.ServiceError | null, response: bria_pb.ListSigningSessionsResponse) => void): grpc.ClientUnaryCall;
    public listSigningSessions(request: bria_pb.ListSigningSessionsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bria_pb.ListSigningSessionsResponse) => void): grpc.ClientUnaryCall;
    public listSigningSessions(request: bria_pb.ListSigningSessionsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bria_pb.ListSigningSessionsResponse) => void): grpc.ClientUnaryCall;
    public subscribeAll(request: bria_pb.SubscribeAllRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<bria_pb.BriaEvent>;
    public subscribeAll(request: bria_pb.SubscribeAllRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<bria_pb.BriaEvent>;
}
