// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var notifications_pb = require('./notifications_pb.js');

function serialize_services_notifications_v1_AddPushDeviceTokenRequest(arg) {
  if (!(arg instanceof notifications_pb.AddPushDeviceTokenRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.AddPushDeviceTokenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_AddPushDeviceTokenRequest(buffer_arg) {
  return notifications_pb.AddPushDeviceTokenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_AddPushDeviceTokenResponse(arg) {
  if (!(arg instanceof notifications_pb.AddPushDeviceTokenResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.AddPushDeviceTokenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_AddPushDeviceTokenResponse(buffer_arg) {
  return notifications_pb.AddPushDeviceTokenResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_DisableNotificationCategoryRequest(arg) {
  if (!(arg instanceof notifications_pb.DisableNotificationCategoryRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.DisableNotificationCategoryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_DisableNotificationCategoryRequest(buffer_arg) {
  return notifications_pb.DisableNotificationCategoryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_DisableNotificationCategoryResponse(arg) {
  if (!(arg instanceof notifications_pb.DisableNotificationCategoryResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.DisableNotificationCategoryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_DisableNotificationCategoryResponse(buffer_arg) {
  return notifications_pb.DisableNotificationCategoryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_DisableNotificationChannelRequest(arg) {
  if (!(arg instanceof notifications_pb.DisableNotificationChannelRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.DisableNotificationChannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_DisableNotificationChannelRequest(buffer_arg) {
  return notifications_pb.DisableNotificationChannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_DisableNotificationChannelResponse(arg) {
  if (!(arg instanceof notifications_pb.DisableNotificationChannelResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.DisableNotificationChannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_DisableNotificationChannelResponse(buffer_arg) {
  return notifications_pb.DisableNotificationChannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_EnableNotificationCategoryRequest(arg) {
  if (!(arg instanceof notifications_pb.EnableNotificationCategoryRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.EnableNotificationCategoryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_EnableNotificationCategoryRequest(buffer_arg) {
  return notifications_pb.EnableNotificationCategoryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_EnableNotificationCategoryResponse(arg) {
  if (!(arg instanceof notifications_pb.EnableNotificationCategoryResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.EnableNotificationCategoryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_EnableNotificationCategoryResponse(buffer_arg) {
  return notifications_pb.EnableNotificationCategoryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_EnableNotificationChannelRequest(arg) {
  if (!(arg instanceof notifications_pb.EnableNotificationChannelRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.EnableNotificationChannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_EnableNotificationChannelRequest(buffer_arg) {
  return notifications_pb.EnableNotificationChannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_EnableNotificationChannelResponse(arg) {
  if (!(arg instanceof notifications_pb.EnableNotificationChannelResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.EnableNotificationChannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_EnableNotificationChannelResponse(buffer_arg) {
  return notifications_pb.EnableNotificationChannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_GetNotificationSettingsRequest(arg) {
  if (!(arg instanceof notifications_pb.GetNotificationSettingsRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.GetNotificationSettingsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_GetNotificationSettingsRequest(buffer_arg) {
  return notifications_pb.GetNotificationSettingsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_GetNotificationSettingsResponse(arg) {
  if (!(arg instanceof notifications_pb.GetNotificationSettingsResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.GetNotificationSettingsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_GetNotificationSettingsResponse(buffer_arg) {
  return notifications_pb.GetNotificationSettingsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_HandleNotificationEventRequest(arg) {
  if (!(arg instanceof notifications_pb.HandleNotificationEventRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.HandleNotificationEventRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_HandleNotificationEventRequest(buffer_arg) {
  return notifications_pb.HandleNotificationEventRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_HandleNotificationEventResponse(arg) {
  if (!(arg instanceof notifications_pb.HandleNotificationEventResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.HandleNotificationEventResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_HandleNotificationEventResponse(buffer_arg) {
  return notifications_pb.HandleNotificationEventResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_RemoveEmailAddressRequest(arg) {
  if (!(arg instanceof notifications_pb.RemoveEmailAddressRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.RemoveEmailAddressRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_RemoveEmailAddressRequest(buffer_arg) {
  return notifications_pb.RemoveEmailAddressRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_RemoveEmailAddressResponse(arg) {
  if (!(arg instanceof notifications_pb.RemoveEmailAddressResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.RemoveEmailAddressResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_RemoveEmailAddressResponse(buffer_arg) {
  return notifications_pb.RemoveEmailAddressResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_RemovePushDeviceTokenRequest(arg) {
  if (!(arg instanceof notifications_pb.RemovePushDeviceTokenRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.RemovePushDeviceTokenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_RemovePushDeviceTokenRequest(buffer_arg) {
  return notifications_pb.RemovePushDeviceTokenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_RemovePushDeviceTokenResponse(arg) {
  if (!(arg instanceof notifications_pb.RemovePushDeviceTokenResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.RemovePushDeviceTokenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_RemovePushDeviceTokenResponse(buffer_arg) {
  return notifications_pb.RemovePushDeviceTokenResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UpdateEmailAddressRequest(arg) {
  if (!(arg instanceof notifications_pb.UpdateEmailAddressRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.UpdateEmailAddressRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UpdateEmailAddressRequest(buffer_arg) {
  return notifications_pb.UpdateEmailAddressRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UpdateEmailAddressResponse(arg) {
  if (!(arg instanceof notifications_pb.UpdateEmailAddressResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.UpdateEmailAddressResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UpdateEmailAddressResponse(buffer_arg) {
  return notifications_pb.UpdateEmailAddressResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UpdateUserLocaleRequest(arg) {
  if (!(arg instanceof notifications_pb.UpdateUserLocaleRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.UpdateUserLocaleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UpdateUserLocaleRequest(buffer_arg) {
  return notifications_pb.UpdateUserLocaleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UpdateUserLocaleResponse(arg) {
  if (!(arg instanceof notifications_pb.UpdateUserLocaleResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.UpdateUserLocaleResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UpdateUserLocaleResponse(buffer_arg) {
  return notifications_pb.UpdateUserLocaleResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var NotificationsServiceService = exports.NotificationsServiceService = {
  enableNotificationChannel: {
    path: '/services.notifications.v1.NotificationsService/EnableNotificationChannel',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.EnableNotificationChannelRequest,
    responseType: notifications_pb.EnableNotificationChannelResponse,
    requestSerialize: serialize_services_notifications_v1_EnableNotificationChannelRequest,
    requestDeserialize: deserialize_services_notifications_v1_EnableNotificationChannelRequest,
    responseSerialize: serialize_services_notifications_v1_EnableNotificationChannelResponse,
    responseDeserialize: deserialize_services_notifications_v1_EnableNotificationChannelResponse,
  },
  disableNotificationChannel: {
    path: '/services.notifications.v1.NotificationsService/DisableNotificationChannel',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.DisableNotificationChannelRequest,
    responseType: notifications_pb.DisableNotificationChannelResponse,
    requestSerialize: serialize_services_notifications_v1_DisableNotificationChannelRequest,
    requestDeserialize: deserialize_services_notifications_v1_DisableNotificationChannelRequest,
    responseSerialize: serialize_services_notifications_v1_DisableNotificationChannelResponse,
    responseDeserialize: deserialize_services_notifications_v1_DisableNotificationChannelResponse,
  },
  enableNotificationCategory: {
    path: '/services.notifications.v1.NotificationsService/EnableNotificationCategory',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.EnableNotificationCategoryRequest,
    responseType: notifications_pb.EnableNotificationCategoryResponse,
    requestSerialize: serialize_services_notifications_v1_EnableNotificationCategoryRequest,
    requestDeserialize: deserialize_services_notifications_v1_EnableNotificationCategoryRequest,
    responseSerialize: serialize_services_notifications_v1_EnableNotificationCategoryResponse,
    responseDeserialize: deserialize_services_notifications_v1_EnableNotificationCategoryResponse,
  },
  disableNotificationCategory: {
    path: '/services.notifications.v1.NotificationsService/DisableNotificationCategory',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.DisableNotificationCategoryRequest,
    responseType: notifications_pb.DisableNotificationCategoryResponse,
    requestSerialize: serialize_services_notifications_v1_DisableNotificationCategoryRequest,
    requestDeserialize: deserialize_services_notifications_v1_DisableNotificationCategoryRequest,
    responseSerialize: serialize_services_notifications_v1_DisableNotificationCategoryResponse,
    responseDeserialize: deserialize_services_notifications_v1_DisableNotificationCategoryResponse,
  },
  getNotificationSettings: {
    path: '/services.notifications.v1.NotificationsService/GetNotificationSettings',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.GetNotificationSettingsRequest,
    responseType: notifications_pb.GetNotificationSettingsResponse,
    requestSerialize: serialize_services_notifications_v1_GetNotificationSettingsRequest,
    requestDeserialize: deserialize_services_notifications_v1_GetNotificationSettingsRequest,
    responseSerialize: serialize_services_notifications_v1_GetNotificationSettingsResponse,
    responseDeserialize: deserialize_services_notifications_v1_GetNotificationSettingsResponse,
  },
  updateUserLocale: {
    path: '/services.notifications.v1.NotificationsService/UpdateUserLocale',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.UpdateUserLocaleRequest,
    responseType: notifications_pb.UpdateUserLocaleResponse,
    requestSerialize: serialize_services_notifications_v1_UpdateUserLocaleRequest,
    requestDeserialize: deserialize_services_notifications_v1_UpdateUserLocaleRequest,
    responseSerialize: serialize_services_notifications_v1_UpdateUserLocaleResponse,
    responseDeserialize: deserialize_services_notifications_v1_UpdateUserLocaleResponse,
  },
  addPushDeviceToken: {
    path: '/services.notifications.v1.NotificationsService/AddPushDeviceToken',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.AddPushDeviceTokenRequest,
    responseType: notifications_pb.AddPushDeviceTokenResponse,
    requestSerialize: serialize_services_notifications_v1_AddPushDeviceTokenRequest,
    requestDeserialize: deserialize_services_notifications_v1_AddPushDeviceTokenRequest,
    responseSerialize: serialize_services_notifications_v1_AddPushDeviceTokenResponse,
    responseDeserialize: deserialize_services_notifications_v1_AddPushDeviceTokenResponse,
  },
  removePushDeviceToken: {
    path: '/services.notifications.v1.NotificationsService/RemovePushDeviceToken',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.RemovePushDeviceTokenRequest,
    responseType: notifications_pb.RemovePushDeviceTokenResponse,
    requestSerialize: serialize_services_notifications_v1_RemovePushDeviceTokenRequest,
    requestDeserialize: deserialize_services_notifications_v1_RemovePushDeviceTokenRequest,
    responseSerialize: serialize_services_notifications_v1_RemovePushDeviceTokenResponse,
    responseDeserialize: deserialize_services_notifications_v1_RemovePushDeviceTokenResponse,
  },
  updateEmailAddress: {
    path: '/services.notifications.v1.NotificationsService/UpdateEmailAddress',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.UpdateEmailAddressRequest,
    responseType: notifications_pb.UpdateEmailAddressResponse,
    requestSerialize: serialize_services_notifications_v1_UpdateEmailAddressRequest,
    requestDeserialize: deserialize_services_notifications_v1_UpdateEmailAddressRequest,
    responseSerialize: serialize_services_notifications_v1_UpdateEmailAddressResponse,
    responseDeserialize: deserialize_services_notifications_v1_UpdateEmailAddressResponse,
  },
  removeEmailAddress: {
    path: '/services.notifications.v1.NotificationsService/RemoveEmailAddress',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.RemoveEmailAddressRequest,
    responseType: notifications_pb.RemoveEmailAddressResponse,
    requestSerialize: serialize_services_notifications_v1_RemoveEmailAddressRequest,
    requestDeserialize: deserialize_services_notifications_v1_RemoveEmailAddressRequest,
    responseSerialize: serialize_services_notifications_v1_RemoveEmailAddressResponse,
    responseDeserialize: deserialize_services_notifications_v1_RemoveEmailAddressResponse,
  },
  handleNotificationEvent: {
    path: '/services.notifications.v1.NotificationsService/HandleNotificationEvent',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.HandleNotificationEventRequest,
    responseType: notifications_pb.HandleNotificationEventResponse,
    requestSerialize: serialize_services_notifications_v1_HandleNotificationEventRequest,
    requestDeserialize: deserialize_services_notifications_v1_HandleNotificationEventRequest,
    responseSerialize: serialize_services_notifications_v1_HandleNotificationEventResponse,
    responseDeserialize: deserialize_services_notifications_v1_HandleNotificationEventResponse,
  },
};

exports.NotificationsServiceClient = grpc.makeGenericClientConstructor(NotificationsServiceService);
