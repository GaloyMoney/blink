// package: services.notifications.v1
// file: notifications.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as notifications_pb from "./notifications_pb";

interface INotificationsServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    enableNotificationChannel: INotificationsServiceService_IEnableNotificationChannel;
    disableNotificationChannel: INotificationsServiceService_IDisableNotificationChannel;
    enableNotificationCategory: INotificationsServiceService_IEnableNotificationCategory;
    disableNotificationCategory: INotificationsServiceService_IDisableNotificationCategory;
    getNotificationSettings: INotificationsServiceService_IGetNotificationSettings;
    updateUserLocale: INotificationsServiceService_IUpdateUserLocale;
    addPushDeviceToken: INotificationsServiceService_IAddPushDeviceToken;
    removePushDeviceToken: INotificationsServiceService_IRemovePushDeviceToken;
    updateEmailAddress: INotificationsServiceService_IUpdateEmailAddress;
    removeEmailAddress: INotificationsServiceService_IRemoveEmailAddress;
    handleNotificationEvent: INotificationsServiceService_IHandleNotificationEvent;
}

interface INotificationsServiceService_IEnableNotificationChannel extends grpc.MethodDefinition<notifications_pb.EnableNotificationChannelRequest, notifications_pb.EnableNotificationChannelResponse> {
    path: "/services.notifications.v1.NotificationsService/EnableNotificationChannel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.EnableNotificationChannelRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.EnableNotificationChannelRequest>;
    responseSerialize: grpc.serialize<notifications_pb.EnableNotificationChannelResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.EnableNotificationChannelResponse>;
}
interface INotificationsServiceService_IDisableNotificationChannel extends grpc.MethodDefinition<notifications_pb.DisableNotificationChannelRequest, notifications_pb.DisableNotificationChannelResponse> {
    path: "/services.notifications.v1.NotificationsService/DisableNotificationChannel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.DisableNotificationChannelRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.DisableNotificationChannelRequest>;
    responseSerialize: grpc.serialize<notifications_pb.DisableNotificationChannelResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.DisableNotificationChannelResponse>;
}
interface INotificationsServiceService_IEnableNotificationCategory extends grpc.MethodDefinition<notifications_pb.EnableNotificationCategoryRequest, notifications_pb.EnableNotificationCategoryResponse> {
    path: "/services.notifications.v1.NotificationsService/EnableNotificationCategory";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.EnableNotificationCategoryRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.EnableNotificationCategoryRequest>;
    responseSerialize: grpc.serialize<notifications_pb.EnableNotificationCategoryResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.EnableNotificationCategoryResponse>;
}
interface INotificationsServiceService_IDisableNotificationCategory extends grpc.MethodDefinition<notifications_pb.DisableNotificationCategoryRequest, notifications_pb.DisableNotificationCategoryResponse> {
    path: "/services.notifications.v1.NotificationsService/DisableNotificationCategory";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.DisableNotificationCategoryRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.DisableNotificationCategoryRequest>;
    responseSerialize: grpc.serialize<notifications_pb.DisableNotificationCategoryResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.DisableNotificationCategoryResponse>;
}
interface INotificationsServiceService_IGetNotificationSettings extends grpc.MethodDefinition<notifications_pb.GetNotificationSettingsRequest, notifications_pb.GetNotificationSettingsResponse> {
    path: "/services.notifications.v1.NotificationsService/GetNotificationSettings";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.GetNotificationSettingsRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.GetNotificationSettingsRequest>;
    responseSerialize: grpc.serialize<notifications_pb.GetNotificationSettingsResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.GetNotificationSettingsResponse>;
}
interface INotificationsServiceService_IUpdateUserLocale extends grpc.MethodDefinition<notifications_pb.UpdateUserLocaleRequest, notifications_pb.UpdateUserLocaleResponse> {
    path: "/services.notifications.v1.NotificationsService/UpdateUserLocale";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.UpdateUserLocaleRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.UpdateUserLocaleRequest>;
    responseSerialize: grpc.serialize<notifications_pb.UpdateUserLocaleResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.UpdateUserLocaleResponse>;
}
interface INotificationsServiceService_IAddPushDeviceToken extends grpc.MethodDefinition<notifications_pb.AddPushDeviceTokenRequest, notifications_pb.AddPushDeviceTokenResponse> {
    path: "/services.notifications.v1.NotificationsService/AddPushDeviceToken";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.AddPushDeviceTokenRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.AddPushDeviceTokenRequest>;
    responseSerialize: grpc.serialize<notifications_pb.AddPushDeviceTokenResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.AddPushDeviceTokenResponse>;
}
interface INotificationsServiceService_IRemovePushDeviceToken extends grpc.MethodDefinition<notifications_pb.RemovePushDeviceTokenRequest, notifications_pb.RemovePushDeviceTokenResponse> {
    path: "/services.notifications.v1.NotificationsService/RemovePushDeviceToken";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.RemovePushDeviceTokenRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.RemovePushDeviceTokenRequest>;
    responseSerialize: grpc.serialize<notifications_pb.RemovePushDeviceTokenResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.RemovePushDeviceTokenResponse>;
}
interface INotificationsServiceService_IUpdateEmailAddress extends grpc.MethodDefinition<notifications_pb.UpdateEmailAddressRequest, notifications_pb.UpdateEmailAddressResponse> {
    path: "/services.notifications.v1.NotificationsService/UpdateEmailAddress";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.UpdateEmailAddressRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.UpdateEmailAddressRequest>;
    responseSerialize: grpc.serialize<notifications_pb.UpdateEmailAddressResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.UpdateEmailAddressResponse>;
}
interface INotificationsServiceService_IRemoveEmailAddress extends grpc.MethodDefinition<notifications_pb.RemoveEmailAddressRequest, notifications_pb.RemoveEmailAddressResponse> {
    path: "/services.notifications.v1.NotificationsService/RemoveEmailAddress";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.RemoveEmailAddressRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.RemoveEmailAddressRequest>;
    responseSerialize: grpc.serialize<notifications_pb.RemoveEmailAddressResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.RemoveEmailAddressResponse>;
}
interface INotificationsServiceService_IHandleNotificationEvent extends grpc.MethodDefinition<notifications_pb.HandleNotificationEventRequest, notifications_pb.HandleNotificationEventResponse> {
    path: "/services.notifications.v1.NotificationsService/HandleNotificationEvent";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.HandleNotificationEventRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.HandleNotificationEventRequest>;
    responseSerialize: grpc.serialize<notifications_pb.HandleNotificationEventResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.HandleNotificationEventResponse>;
}

export const NotificationsServiceService: INotificationsServiceService;

export interface INotificationsServiceServer extends grpc.UntypedServiceImplementation {
    enableNotificationChannel: grpc.handleUnaryCall<notifications_pb.EnableNotificationChannelRequest, notifications_pb.EnableNotificationChannelResponse>;
    disableNotificationChannel: grpc.handleUnaryCall<notifications_pb.DisableNotificationChannelRequest, notifications_pb.DisableNotificationChannelResponse>;
    enableNotificationCategory: grpc.handleUnaryCall<notifications_pb.EnableNotificationCategoryRequest, notifications_pb.EnableNotificationCategoryResponse>;
    disableNotificationCategory: grpc.handleUnaryCall<notifications_pb.DisableNotificationCategoryRequest, notifications_pb.DisableNotificationCategoryResponse>;
    getNotificationSettings: grpc.handleUnaryCall<notifications_pb.GetNotificationSettingsRequest, notifications_pb.GetNotificationSettingsResponse>;
    updateUserLocale: grpc.handleUnaryCall<notifications_pb.UpdateUserLocaleRequest, notifications_pb.UpdateUserLocaleResponse>;
    addPushDeviceToken: grpc.handleUnaryCall<notifications_pb.AddPushDeviceTokenRequest, notifications_pb.AddPushDeviceTokenResponse>;
    removePushDeviceToken: grpc.handleUnaryCall<notifications_pb.RemovePushDeviceTokenRequest, notifications_pb.RemovePushDeviceTokenResponse>;
    updateEmailAddress: grpc.handleUnaryCall<notifications_pb.UpdateEmailAddressRequest, notifications_pb.UpdateEmailAddressResponse>;
    removeEmailAddress: grpc.handleUnaryCall<notifications_pb.RemoveEmailAddressRequest, notifications_pb.RemoveEmailAddressResponse>;
    handleNotificationEvent: grpc.handleUnaryCall<notifications_pb.HandleNotificationEventRequest, notifications_pb.HandleNotificationEventResponse>;
}

export interface INotificationsServiceClient {
    enableNotificationChannel(request: notifications_pb.EnableNotificationChannelRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.EnableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    enableNotificationChannel(request: notifications_pb.EnableNotificationChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.EnableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    enableNotificationChannel(request: notifications_pb.EnableNotificationChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.EnableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    disableNotificationChannel(request: notifications_pb.DisableNotificationChannelRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.DisableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    disableNotificationChannel(request: notifications_pb.DisableNotificationChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.DisableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    disableNotificationChannel(request: notifications_pb.DisableNotificationChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.DisableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    enableNotificationCategory(request: notifications_pb.EnableNotificationCategoryRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.EnableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    enableNotificationCategory(request: notifications_pb.EnableNotificationCategoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.EnableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    enableNotificationCategory(request: notifications_pb.EnableNotificationCategoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.EnableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    disableNotificationCategory(request: notifications_pb.DisableNotificationCategoryRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.DisableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    disableNotificationCategory(request: notifications_pb.DisableNotificationCategoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.DisableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    disableNotificationCategory(request: notifications_pb.DisableNotificationCategoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.DisableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    getNotificationSettings(request: notifications_pb.GetNotificationSettingsRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.GetNotificationSettingsResponse) => void): grpc.ClientUnaryCall;
    getNotificationSettings(request: notifications_pb.GetNotificationSettingsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.GetNotificationSettingsResponse) => void): grpc.ClientUnaryCall;
    getNotificationSettings(request: notifications_pb.GetNotificationSettingsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.GetNotificationSettingsResponse) => void): grpc.ClientUnaryCall;
    updateUserLocale(request: notifications_pb.UpdateUserLocaleRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.UpdateUserLocaleResponse) => void): grpc.ClientUnaryCall;
    updateUserLocale(request: notifications_pb.UpdateUserLocaleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.UpdateUserLocaleResponse) => void): grpc.ClientUnaryCall;
    updateUserLocale(request: notifications_pb.UpdateUserLocaleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.UpdateUserLocaleResponse) => void): grpc.ClientUnaryCall;
    addPushDeviceToken(request: notifications_pb.AddPushDeviceTokenRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.AddPushDeviceTokenResponse) => void): grpc.ClientUnaryCall;
    addPushDeviceToken(request: notifications_pb.AddPushDeviceTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.AddPushDeviceTokenResponse) => void): grpc.ClientUnaryCall;
    addPushDeviceToken(request: notifications_pb.AddPushDeviceTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.AddPushDeviceTokenResponse) => void): grpc.ClientUnaryCall;
    removePushDeviceToken(request: notifications_pb.RemovePushDeviceTokenRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.RemovePushDeviceTokenResponse) => void): grpc.ClientUnaryCall;
    removePushDeviceToken(request: notifications_pb.RemovePushDeviceTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.RemovePushDeviceTokenResponse) => void): grpc.ClientUnaryCall;
    removePushDeviceToken(request: notifications_pb.RemovePushDeviceTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.RemovePushDeviceTokenResponse) => void): grpc.ClientUnaryCall;
    updateEmailAddress(request: notifications_pb.UpdateEmailAddressRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.UpdateEmailAddressResponse) => void): grpc.ClientUnaryCall;
    updateEmailAddress(request: notifications_pb.UpdateEmailAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.UpdateEmailAddressResponse) => void): grpc.ClientUnaryCall;
    updateEmailAddress(request: notifications_pb.UpdateEmailAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.UpdateEmailAddressResponse) => void): grpc.ClientUnaryCall;
    removeEmailAddress(request: notifications_pb.RemoveEmailAddressRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.RemoveEmailAddressResponse) => void): grpc.ClientUnaryCall;
    removeEmailAddress(request: notifications_pb.RemoveEmailAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.RemoveEmailAddressResponse) => void): grpc.ClientUnaryCall;
    removeEmailAddress(request: notifications_pb.RemoveEmailAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.RemoveEmailAddressResponse) => void): grpc.ClientUnaryCall;
    handleNotificationEvent(request: notifications_pb.HandleNotificationEventRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.HandleNotificationEventResponse) => void): grpc.ClientUnaryCall;
    handleNotificationEvent(request: notifications_pb.HandleNotificationEventRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.HandleNotificationEventResponse) => void): grpc.ClientUnaryCall;
    handleNotificationEvent(request: notifications_pb.HandleNotificationEventRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.HandleNotificationEventResponse) => void): grpc.ClientUnaryCall;
}

export class NotificationsServiceClient extends grpc.Client implements INotificationsServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public enableNotificationChannel(request: notifications_pb.EnableNotificationChannelRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.EnableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    public enableNotificationChannel(request: notifications_pb.EnableNotificationChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.EnableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    public enableNotificationChannel(request: notifications_pb.EnableNotificationChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.EnableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    public disableNotificationChannel(request: notifications_pb.DisableNotificationChannelRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.DisableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    public disableNotificationChannel(request: notifications_pb.DisableNotificationChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.DisableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    public disableNotificationChannel(request: notifications_pb.DisableNotificationChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.DisableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    public enableNotificationCategory(request: notifications_pb.EnableNotificationCategoryRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.EnableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    public enableNotificationCategory(request: notifications_pb.EnableNotificationCategoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.EnableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    public enableNotificationCategory(request: notifications_pb.EnableNotificationCategoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.EnableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    public disableNotificationCategory(request: notifications_pb.DisableNotificationCategoryRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.DisableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    public disableNotificationCategory(request: notifications_pb.DisableNotificationCategoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.DisableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    public disableNotificationCategory(request: notifications_pb.DisableNotificationCategoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.DisableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    public getNotificationSettings(request: notifications_pb.GetNotificationSettingsRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.GetNotificationSettingsResponse) => void): grpc.ClientUnaryCall;
    public getNotificationSettings(request: notifications_pb.GetNotificationSettingsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.GetNotificationSettingsResponse) => void): grpc.ClientUnaryCall;
    public getNotificationSettings(request: notifications_pb.GetNotificationSettingsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.GetNotificationSettingsResponse) => void): grpc.ClientUnaryCall;
    public updateUserLocale(request: notifications_pb.UpdateUserLocaleRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.UpdateUserLocaleResponse) => void): grpc.ClientUnaryCall;
    public updateUserLocale(request: notifications_pb.UpdateUserLocaleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.UpdateUserLocaleResponse) => void): grpc.ClientUnaryCall;
    public updateUserLocale(request: notifications_pb.UpdateUserLocaleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.UpdateUserLocaleResponse) => void): grpc.ClientUnaryCall;
    public addPushDeviceToken(request: notifications_pb.AddPushDeviceTokenRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.AddPushDeviceTokenResponse) => void): grpc.ClientUnaryCall;
    public addPushDeviceToken(request: notifications_pb.AddPushDeviceTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.AddPushDeviceTokenResponse) => void): grpc.ClientUnaryCall;
    public addPushDeviceToken(request: notifications_pb.AddPushDeviceTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.AddPushDeviceTokenResponse) => void): grpc.ClientUnaryCall;
    public removePushDeviceToken(request: notifications_pb.RemovePushDeviceTokenRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.RemovePushDeviceTokenResponse) => void): grpc.ClientUnaryCall;
    public removePushDeviceToken(request: notifications_pb.RemovePushDeviceTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.RemovePushDeviceTokenResponse) => void): grpc.ClientUnaryCall;
    public removePushDeviceToken(request: notifications_pb.RemovePushDeviceTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.RemovePushDeviceTokenResponse) => void): grpc.ClientUnaryCall;
    public updateEmailAddress(request: notifications_pb.UpdateEmailAddressRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.UpdateEmailAddressResponse) => void): grpc.ClientUnaryCall;
    public updateEmailAddress(request: notifications_pb.UpdateEmailAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.UpdateEmailAddressResponse) => void): grpc.ClientUnaryCall;
    public updateEmailAddress(request: notifications_pb.UpdateEmailAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.UpdateEmailAddressResponse) => void): grpc.ClientUnaryCall;
    public removeEmailAddress(request: notifications_pb.RemoveEmailAddressRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.RemoveEmailAddressResponse) => void): grpc.ClientUnaryCall;
    public removeEmailAddress(request: notifications_pb.RemoveEmailAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.RemoveEmailAddressResponse) => void): grpc.ClientUnaryCall;
    public removeEmailAddress(request: notifications_pb.RemoveEmailAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.RemoveEmailAddressResponse) => void): grpc.ClientUnaryCall;
    public handleNotificationEvent(request: notifications_pb.HandleNotificationEventRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.HandleNotificationEventResponse) => void): grpc.ClientUnaryCall;
    public handleNotificationEvent(request: notifications_pb.HandleNotificationEventRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.HandleNotificationEventResponse) => void): grpc.ClientUnaryCall;
    public handleNotificationEvent(request: notifications_pb.HandleNotificationEventRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.HandleNotificationEventResponse) => void): grpc.ClientUnaryCall;
}
