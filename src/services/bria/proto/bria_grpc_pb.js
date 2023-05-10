// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var bria_pb = require('./bria_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');

function serialize_services_bria_v1_BriaEvent(arg) {
  if (!(arg instanceof bria_pb.BriaEvent)) {
    throw new Error('Expected argument of type services.bria.v1.BriaEvent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_BriaEvent(buffer_arg) {
  return bria_pb.BriaEvent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_CreatePayoutQueueRequest(arg) {
  if (!(arg instanceof bria_pb.CreatePayoutQueueRequest)) {
    throw new Error('Expected argument of type services.bria.v1.CreatePayoutQueueRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_CreatePayoutQueueRequest(buffer_arg) {
  return bria_pb.CreatePayoutQueueRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_CreatePayoutQueueResponse(arg) {
  if (!(arg instanceof bria_pb.CreatePayoutQueueResponse)) {
    throw new Error('Expected argument of type services.bria.v1.CreatePayoutQueueResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_CreatePayoutQueueResponse(buffer_arg) {
  return bria_pb.CreatePayoutQueueResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_CreateProfileApiKeyRequest(arg) {
  if (!(arg instanceof bria_pb.CreateProfileApiKeyRequest)) {
    throw new Error('Expected argument of type services.bria.v1.CreateProfileApiKeyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_CreateProfileApiKeyRequest(buffer_arg) {
  return bria_pb.CreateProfileApiKeyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_CreateProfileApiKeyResponse(arg) {
  if (!(arg instanceof bria_pb.CreateProfileApiKeyResponse)) {
    throw new Error('Expected argument of type services.bria.v1.CreateProfileApiKeyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_CreateProfileApiKeyResponse(buffer_arg) {
  return bria_pb.CreateProfileApiKeyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_CreateProfileRequest(arg) {
  if (!(arg instanceof bria_pb.CreateProfileRequest)) {
    throw new Error('Expected argument of type services.bria.v1.CreateProfileRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_CreateProfileRequest(buffer_arg) {
  return bria_pb.CreateProfileRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_CreateProfileResponse(arg) {
  if (!(arg instanceof bria_pb.CreateProfileResponse)) {
    throw new Error('Expected argument of type services.bria.v1.CreateProfileResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_CreateProfileResponse(buffer_arg) {
  return bria_pb.CreateProfileResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_CreateWalletRequest(arg) {
  if (!(arg instanceof bria_pb.CreateWalletRequest)) {
    throw new Error('Expected argument of type services.bria.v1.CreateWalletRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_CreateWalletRequest(buffer_arg) {
  return bria_pb.CreateWalletRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_CreateWalletResponse(arg) {
  if (!(arg instanceof bria_pb.CreateWalletResponse)) {
    throw new Error('Expected argument of type services.bria.v1.CreateWalletResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_CreateWalletResponse(buffer_arg) {
  return bria_pb.CreateWalletResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_GetAccountBalanceSummaryRequest(arg) {
  if (!(arg instanceof bria_pb.GetAccountBalanceSummaryRequest)) {
    throw new Error('Expected argument of type services.bria.v1.GetAccountBalanceSummaryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_GetAccountBalanceSummaryRequest(buffer_arg) {
  return bria_pb.GetAccountBalanceSummaryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_GetAccountBalanceSummaryResponse(arg) {
  if (!(arg instanceof bria_pb.GetAccountBalanceSummaryResponse)) {
    throw new Error('Expected argument of type services.bria.v1.GetAccountBalanceSummaryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_GetAccountBalanceSummaryResponse(buffer_arg) {
  return bria_pb.GetAccountBalanceSummaryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_GetWalletBalanceSummaryRequest(arg) {
  if (!(arg instanceof bria_pb.GetWalletBalanceSummaryRequest)) {
    throw new Error('Expected argument of type services.bria.v1.GetWalletBalanceSummaryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_GetWalletBalanceSummaryRequest(buffer_arg) {
  return bria_pb.GetWalletBalanceSummaryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_GetWalletBalanceSummaryResponse(arg) {
  if (!(arg instanceof bria_pb.GetWalletBalanceSummaryResponse)) {
    throw new Error('Expected argument of type services.bria.v1.GetWalletBalanceSummaryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_GetWalletBalanceSummaryResponse(buffer_arg) {
  return bria_pb.GetWalletBalanceSummaryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ImportXpubRequest(arg) {
  if (!(arg instanceof bria_pb.ImportXpubRequest)) {
    throw new Error('Expected argument of type services.bria.v1.ImportXpubRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ImportXpubRequest(buffer_arg) {
  return bria_pb.ImportXpubRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ImportXpubResponse(arg) {
  if (!(arg instanceof bria_pb.ImportXpubResponse)) {
    throw new Error('Expected argument of type services.bria.v1.ImportXpubResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ImportXpubResponse(buffer_arg) {
  return bria_pb.ImportXpubResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListAddressesRequest(arg) {
  if (!(arg instanceof bria_pb.ListAddressesRequest)) {
    throw new Error('Expected argument of type services.bria.v1.ListAddressesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListAddressesRequest(buffer_arg) {
  return bria_pb.ListAddressesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListAddressesResponse(arg) {
  if (!(arg instanceof bria_pb.ListAddressesResponse)) {
    throw new Error('Expected argument of type services.bria.v1.ListAddressesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListAddressesResponse(buffer_arg) {
  return bria_pb.ListAddressesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListPayoutQueuesRequest(arg) {
  if (!(arg instanceof bria_pb.ListPayoutQueuesRequest)) {
    throw new Error('Expected argument of type services.bria.v1.ListPayoutQueuesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListPayoutQueuesRequest(buffer_arg) {
  return bria_pb.ListPayoutQueuesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListPayoutQueuesResponse(arg) {
  if (!(arg instanceof bria_pb.ListPayoutQueuesResponse)) {
    throw new Error('Expected argument of type services.bria.v1.ListPayoutQueuesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListPayoutQueuesResponse(buffer_arg) {
  return bria_pb.ListPayoutQueuesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListPayoutsRequest(arg) {
  if (!(arg instanceof bria_pb.ListPayoutsRequest)) {
    throw new Error('Expected argument of type services.bria.v1.ListPayoutsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListPayoutsRequest(buffer_arg) {
  return bria_pb.ListPayoutsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListPayoutsResponse(arg) {
  if (!(arg instanceof bria_pb.ListPayoutsResponse)) {
    throw new Error('Expected argument of type services.bria.v1.ListPayoutsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListPayoutsResponse(buffer_arg) {
  return bria_pb.ListPayoutsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListProfilesRequest(arg) {
  if (!(arg instanceof bria_pb.ListProfilesRequest)) {
    throw new Error('Expected argument of type services.bria.v1.ListProfilesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListProfilesRequest(buffer_arg) {
  return bria_pb.ListProfilesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListProfilesResponse(arg) {
  if (!(arg instanceof bria_pb.ListProfilesResponse)) {
    throw new Error('Expected argument of type services.bria.v1.ListProfilesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListProfilesResponse(buffer_arg) {
  return bria_pb.ListProfilesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListSigningSessionsRequest(arg) {
  if (!(arg instanceof bria_pb.ListSigningSessionsRequest)) {
    throw new Error('Expected argument of type services.bria.v1.ListSigningSessionsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListSigningSessionsRequest(buffer_arg) {
  return bria_pb.ListSigningSessionsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListSigningSessionsResponse(arg) {
  if (!(arg instanceof bria_pb.ListSigningSessionsResponse)) {
    throw new Error('Expected argument of type services.bria.v1.ListSigningSessionsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListSigningSessionsResponse(buffer_arg) {
  return bria_pb.ListSigningSessionsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListUtxosRequest(arg) {
  if (!(arg instanceof bria_pb.ListUtxosRequest)) {
    throw new Error('Expected argument of type services.bria.v1.ListUtxosRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListUtxosRequest(buffer_arg) {
  return bria_pb.ListUtxosRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListUtxosResponse(arg) {
  if (!(arg instanceof bria_pb.ListUtxosResponse)) {
    throw new Error('Expected argument of type services.bria.v1.ListUtxosResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListUtxosResponse(buffer_arg) {
  return bria_pb.ListUtxosResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListWalletsRequest(arg) {
  if (!(arg instanceof bria_pb.ListWalletsRequest)) {
    throw new Error('Expected argument of type services.bria.v1.ListWalletsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListWalletsRequest(buffer_arg) {
  return bria_pb.ListWalletsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListWalletsResponse(arg) {
  if (!(arg instanceof bria_pb.ListWalletsResponse)) {
    throw new Error('Expected argument of type services.bria.v1.ListWalletsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListWalletsResponse(buffer_arg) {
  return bria_pb.ListWalletsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListXpubsRequest(arg) {
  if (!(arg instanceof bria_pb.ListXpubsRequest)) {
    throw new Error('Expected argument of type services.bria.v1.ListXpubsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListXpubsRequest(buffer_arg) {
  return bria_pb.ListXpubsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_ListXpubsResponse(arg) {
  if (!(arg instanceof bria_pb.ListXpubsResponse)) {
    throw new Error('Expected argument of type services.bria.v1.ListXpubsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_ListXpubsResponse(buffer_arg) {
  return bria_pb.ListXpubsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_NewAddressRequest(arg) {
  if (!(arg instanceof bria_pb.NewAddressRequest)) {
    throw new Error('Expected argument of type services.bria.v1.NewAddressRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_NewAddressRequest(buffer_arg) {
  return bria_pb.NewAddressRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_NewAddressResponse(arg) {
  if (!(arg instanceof bria_pb.NewAddressResponse)) {
    throw new Error('Expected argument of type services.bria.v1.NewAddressResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_NewAddressResponse(buffer_arg) {
  return bria_pb.NewAddressResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_SetSignerConfigRequest(arg) {
  if (!(arg instanceof bria_pb.SetSignerConfigRequest)) {
    throw new Error('Expected argument of type services.bria.v1.SetSignerConfigRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_SetSignerConfigRequest(buffer_arg) {
  return bria_pb.SetSignerConfigRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_SetSignerConfigResponse(arg) {
  if (!(arg instanceof bria_pb.SetSignerConfigResponse)) {
    throw new Error('Expected argument of type services.bria.v1.SetSignerConfigResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_SetSignerConfigResponse(buffer_arg) {
  return bria_pb.SetSignerConfigResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_SubmitPayoutRequest(arg) {
  if (!(arg instanceof bria_pb.SubmitPayoutRequest)) {
    throw new Error('Expected argument of type services.bria.v1.SubmitPayoutRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_SubmitPayoutRequest(buffer_arg) {
  return bria_pb.SubmitPayoutRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_SubmitPayoutResponse(arg) {
  if (!(arg instanceof bria_pb.SubmitPayoutResponse)) {
    throw new Error('Expected argument of type services.bria.v1.SubmitPayoutResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_SubmitPayoutResponse(buffer_arg) {
  return bria_pb.SubmitPayoutResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_SubscribeAllRequest(arg) {
  if (!(arg instanceof bria_pb.SubscribeAllRequest)) {
    throw new Error('Expected argument of type services.bria.v1.SubscribeAllRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_SubscribeAllRequest(buffer_arg) {
  return bria_pb.SubscribeAllRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_UpdateAddressRequest(arg) {
  if (!(arg instanceof bria_pb.UpdateAddressRequest)) {
    throw new Error('Expected argument of type services.bria.v1.UpdateAddressRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_UpdateAddressRequest(buffer_arg) {
  return bria_pb.UpdateAddressRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_UpdateAddressResponse(arg) {
  if (!(arg instanceof bria_pb.UpdateAddressResponse)) {
    throw new Error('Expected argument of type services.bria.v1.UpdateAddressResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_UpdateAddressResponse(buffer_arg) {
  return bria_pb.UpdateAddressResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_UpdatePayoutQueueRequest(arg) {
  if (!(arg instanceof bria_pb.UpdatePayoutQueueRequest)) {
    throw new Error('Expected argument of type services.bria.v1.UpdatePayoutQueueRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_UpdatePayoutQueueRequest(buffer_arg) {
  return bria_pb.UpdatePayoutQueueRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_bria_v1_UpdatePayoutQueueResponse(arg) {
  if (!(arg instanceof bria_pb.UpdatePayoutQueueResponse)) {
    throw new Error('Expected argument of type services.bria.v1.UpdatePayoutQueueResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_bria_v1_UpdatePayoutQueueResponse(buffer_arg) {
  return bria_pb.UpdatePayoutQueueResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var BriaServiceService = exports.BriaServiceService = {
  createProfile: {
    path: '/services.bria.v1.BriaService/CreateProfile',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.CreateProfileRequest,
    responseType: bria_pb.CreateProfileResponse,
    requestSerialize: serialize_services_bria_v1_CreateProfileRequest,
    requestDeserialize: deserialize_services_bria_v1_CreateProfileRequest,
    responseSerialize: serialize_services_bria_v1_CreateProfileResponse,
    responseDeserialize: deserialize_services_bria_v1_CreateProfileResponse,
  },
  listProfiles: {
    path: '/services.bria.v1.BriaService/ListProfiles',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.ListProfilesRequest,
    responseType: bria_pb.ListProfilesResponse,
    requestSerialize: serialize_services_bria_v1_ListProfilesRequest,
    requestDeserialize: deserialize_services_bria_v1_ListProfilesRequest,
    responseSerialize: serialize_services_bria_v1_ListProfilesResponse,
    responseDeserialize: deserialize_services_bria_v1_ListProfilesResponse,
  },
  createProfileApiKey: {
    path: '/services.bria.v1.BriaService/CreateProfileApiKey',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.CreateProfileApiKeyRequest,
    responseType: bria_pb.CreateProfileApiKeyResponse,
    requestSerialize: serialize_services_bria_v1_CreateProfileApiKeyRequest,
    requestDeserialize: deserialize_services_bria_v1_CreateProfileApiKeyRequest,
    responseSerialize: serialize_services_bria_v1_CreateProfileApiKeyResponse,
    responseDeserialize: deserialize_services_bria_v1_CreateProfileApiKeyResponse,
  },
  importXpub: {
    path: '/services.bria.v1.BriaService/ImportXpub',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.ImportXpubRequest,
    responseType: bria_pb.ImportXpubResponse,
    requestSerialize: serialize_services_bria_v1_ImportXpubRequest,
    requestDeserialize: deserialize_services_bria_v1_ImportXpubRequest,
    responseSerialize: serialize_services_bria_v1_ImportXpubResponse,
    responseDeserialize: deserialize_services_bria_v1_ImportXpubResponse,
  },
  listXpubs: {
    path: '/services.bria.v1.BriaService/ListXpubs',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.ListXpubsRequest,
    responseType: bria_pb.ListXpubsResponse,
    requestSerialize: serialize_services_bria_v1_ListXpubsRequest,
    requestDeserialize: deserialize_services_bria_v1_ListXpubsRequest,
    responseSerialize: serialize_services_bria_v1_ListXpubsResponse,
    responseDeserialize: deserialize_services_bria_v1_ListXpubsResponse,
  },
  setSignerConfig: {
    path: '/services.bria.v1.BriaService/SetSignerConfig',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.SetSignerConfigRequest,
    responseType: bria_pb.SetSignerConfigResponse,
    requestSerialize: serialize_services_bria_v1_SetSignerConfigRequest,
    requestDeserialize: deserialize_services_bria_v1_SetSignerConfigRequest,
    responseSerialize: serialize_services_bria_v1_SetSignerConfigResponse,
    responseDeserialize: deserialize_services_bria_v1_SetSignerConfigResponse,
  },
  createWallet: {
    path: '/services.bria.v1.BriaService/CreateWallet',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.CreateWalletRequest,
    responseType: bria_pb.CreateWalletResponse,
    requestSerialize: serialize_services_bria_v1_CreateWalletRequest,
    requestDeserialize: deserialize_services_bria_v1_CreateWalletRequest,
    responseSerialize: serialize_services_bria_v1_CreateWalletResponse,
    responseDeserialize: deserialize_services_bria_v1_CreateWalletResponse,
  },
  listWallets: {
    path: '/services.bria.v1.BriaService/ListWallets',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.ListWalletsRequest,
    responseType: bria_pb.ListWalletsResponse,
    requestSerialize: serialize_services_bria_v1_ListWalletsRequest,
    requestDeserialize: deserialize_services_bria_v1_ListWalletsRequest,
    responseSerialize: serialize_services_bria_v1_ListWalletsResponse,
    responseDeserialize: deserialize_services_bria_v1_ListWalletsResponse,
  },
  getWalletBalanceSummary: {
    path: '/services.bria.v1.BriaService/GetWalletBalanceSummary',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.GetWalletBalanceSummaryRequest,
    responseType: bria_pb.GetWalletBalanceSummaryResponse,
    requestSerialize: serialize_services_bria_v1_GetWalletBalanceSummaryRequest,
    requestDeserialize: deserialize_services_bria_v1_GetWalletBalanceSummaryRequest,
    responseSerialize: serialize_services_bria_v1_GetWalletBalanceSummaryResponse,
    responseDeserialize: deserialize_services_bria_v1_GetWalletBalanceSummaryResponse,
  },
  getAccountBalanceSummary: {
    path: '/services.bria.v1.BriaService/GetAccountBalanceSummary',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.GetAccountBalanceSummaryRequest,
    responseType: bria_pb.GetAccountBalanceSummaryResponse,
    requestSerialize: serialize_services_bria_v1_GetAccountBalanceSummaryRequest,
    requestDeserialize: deserialize_services_bria_v1_GetAccountBalanceSummaryRequest,
    responseSerialize: serialize_services_bria_v1_GetAccountBalanceSummaryResponse,
    responseDeserialize: deserialize_services_bria_v1_GetAccountBalanceSummaryResponse,
  },
  newAddress: {
    path: '/services.bria.v1.BriaService/NewAddress',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.NewAddressRequest,
    responseType: bria_pb.NewAddressResponse,
    requestSerialize: serialize_services_bria_v1_NewAddressRequest,
    requestDeserialize: deserialize_services_bria_v1_NewAddressRequest,
    responseSerialize: serialize_services_bria_v1_NewAddressResponse,
    responseDeserialize: deserialize_services_bria_v1_NewAddressResponse,
  },
  updateAddress: {
    path: '/services.bria.v1.BriaService/UpdateAddress',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.UpdateAddressRequest,
    responseType: bria_pb.UpdateAddressResponse,
    requestSerialize: serialize_services_bria_v1_UpdateAddressRequest,
    requestDeserialize: deserialize_services_bria_v1_UpdateAddressRequest,
    responseSerialize: serialize_services_bria_v1_UpdateAddressResponse,
    responseDeserialize: deserialize_services_bria_v1_UpdateAddressResponse,
  },
  listAddresses: {
    path: '/services.bria.v1.BriaService/ListAddresses',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.ListAddressesRequest,
    responseType: bria_pb.ListAddressesResponse,
    requestSerialize: serialize_services_bria_v1_ListAddressesRequest,
    requestDeserialize: deserialize_services_bria_v1_ListAddressesRequest,
    responseSerialize: serialize_services_bria_v1_ListAddressesResponse,
    responseDeserialize: deserialize_services_bria_v1_ListAddressesResponse,
  },
  listUtxos: {
    path: '/services.bria.v1.BriaService/ListUtxos',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.ListUtxosRequest,
    responseType: bria_pb.ListUtxosResponse,
    requestSerialize: serialize_services_bria_v1_ListUtxosRequest,
    requestDeserialize: deserialize_services_bria_v1_ListUtxosRequest,
    responseSerialize: serialize_services_bria_v1_ListUtxosResponse,
    responseDeserialize: deserialize_services_bria_v1_ListUtxosResponse,
  },
  createPayoutQueue: {
    path: '/services.bria.v1.BriaService/CreatePayoutQueue',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.CreatePayoutQueueRequest,
    responseType: bria_pb.CreatePayoutQueueResponse,
    requestSerialize: serialize_services_bria_v1_CreatePayoutQueueRequest,
    requestDeserialize: deserialize_services_bria_v1_CreatePayoutQueueRequest,
    responseSerialize: serialize_services_bria_v1_CreatePayoutQueueResponse,
    responseDeserialize: deserialize_services_bria_v1_CreatePayoutQueueResponse,
  },
  listPayoutQueues: {
    path: '/services.bria.v1.BriaService/ListPayoutQueues',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.ListPayoutQueuesRequest,
    responseType: bria_pb.ListPayoutQueuesResponse,
    requestSerialize: serialize_services_bria_v1_ListPayoutQueuesRequest,
    requestDeserialize: deserialize_services_bria_v1_ListPayoutQueuesRequest,
    responseSerialize: serialize_services_bria_v1_ListPayoutQueuesResponse,
    responseDeserialize: deserialize_services_bria_v1_ListPayoutQueuesResponse,
  },
  updatePayoutQueue: {
    path: '/services.bria.v1.BriaService/UpdatePayoutQueue',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.UpdatePayoutQueueRequest,
    responseType: bria_pb.UpdatePayoutQueueResponse,
    requestSerialize: serialize_services_bria_v1_UpdatePayoutQueueRequest,
    requestDeserialize: deserialize_services_bria_v1_UpdatePayoutQueueRequest,
    responseSerialize: serialize_services_bria_v1_UpdatePayoutQueueResponse,
    responseDeserialize: deserialize_services_bria_v1_UpdatePayoutQueueResponse,
  },
  submitPayout: {
    path: '/services.bria.v1.BriaService/SubmitPayout',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.SubmitPayoutRequest,
    responseType: bria_pb.SubmitPayoutResponse,
    requestSerialize: serialize_services_bria_v1_SubmitPayoutRequest,
    requestDeserialize: deserialize_services_bria_v1_SubmitPayoutRequest,
    responseSerialize: serialize_services_bria_v1_SubmitPayoutResponse,
    responseDeserialize: deserialize_services_bria_v1_SubmitPayoutResponse,
  },
  listPayouts: {
    path: '/services.bria.v1.BriaService/ListPayouts',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.ListPayoutsRequest,
    responseType: bria_pb.ListPayoutsResponse,
    requestSerialize: serialize_services_bria_v1_ListPayoutsRequest,
    requestDeserialize: deserialize_services_bria_v1_ListPayoutsRequest,
    responseSerialize: serialize_services_bria_v1_ListPayoutsResponse,
    responseDeserialize: deserialize_services_bria_v1_ListPayoutsResponse,
  },
  listSigningSessions: {
    path: '/services.bria.v1.BriaService/ListSigningSessions',
    requestStream: false,
    responseStream: false,
    requestType: bria_pb.ListSigningSessionsRequest,
    responseType: bria_pb.ListSigningSessionsResponse,
    requestSerialize: serialize_services_bria_v1_ListSigningSessionsRequest,
    requestDeserialize: deserialize_services_bria_v1_ListSigningSessionsRequest,
    responseSerialize: serialize_services_bria_v1_ListSigningSessionsResponse,
    responseDeserialize: deserialize_services_bria_v1_ListSigningSessionsResponse,
  },
  subscribeAll: {
    path: '/services.bria.v1.BriaService/SubscribeAll',
    requestStream: false,
    responseStream: true,
    requestType: bria_pb.SubscribeAllRequest,
    responseType: bria_pb.BriaEvent,
    requestSerialize: serialize_services_bria_v1_SubscribeAllRequest,
    requestDeserialize: deserialize_services_bria_v1_SubscribeAllRequest,
    responseSerialize: serialize_services_bria_v1_BriaEvent,
    responseDeserialize: deserialize_services_bria_v1_BriaEvent,
  },
};

exports.BriaServiceClient = grpc.makeGenericClientConstructor(BriaServiceService);
