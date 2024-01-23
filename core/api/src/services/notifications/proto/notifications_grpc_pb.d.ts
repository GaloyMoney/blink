// package: services.notifications.v1
// file: notifications.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as notifications_pb from "./notifications_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

interface INotificationsServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    shouldSendNotification: INotificationsServiceService_IShouldSendNotification;
    enableNotificationChannel: INotificationsServiceService_IEnableNotificationChannel;
    disableNotificationChannel: INotificationsServiceService_IDisableNotificationChannel;
    enableNotificationCategory: INotificationsServiceService_IEnableNotificationCategory;
    disableNotificationCategory: INotificationsServiceService_IDisableNotificationCategory;
    getNotificationSettings: INotificationsServiceService_IGetNotificationSettings;
    updateUserLocale: INotificationsServiceService_IUpdateUserLocale;
}

interface INotificationsServiceService_IShouldSendNotification extends grpc.MethodDefinition<notifications_pb.ShouldSendNotificationRequest, notifications_pb.ShouldSendNotificationResponse> {
    path: "/services.notifications.v1.NotificationsService/ShouldSendNotification";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.ShouldSendNotificationRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.ShouldSendNotificationRequest>;
    responseSerialize: grpc.serialize<notifications_pb.ShouldSendNotificationResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.ShouldSendNotificationResponse>;
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

export const NotificationsServiceService: INotificationsServiceService;

export interface INotificationsServiceServer extends grpc.UntypedServiceImplementation {
    shouldSendNotification: grpc.handleUnaryCall<notifications_pb.ShouldSendNotificationRequest, notifications_pb.ShouldSendNotificationResponse>;
    enableNotificationChannel: grpc.handleUnaryCall<notifications_pb.EnableNotificationChannelRequest, notifications_pb.EnableNotificationChannelResponse>;
    disableNotificationChannel: grpc.handleUnaryCall<notifications_pb.DisableNotificationChannelRequest, notifications_pb.DisableNotificationChannelResponse>;
    enableNotificationCategory: grpc.handleUnaryCall<notifications_pb.EnableNotificationCategoryRequest, notifications_pb.EnableNotificationCategoryResponse>;
    disableNotificationCategory: grpc.handleUnaryCall<notifications_pb.DisableNotificationCategoryRequest, notifications_pb.DisableNotificationCategoryResponse>;
    getNotificationSettings: grpc.handleUnaryCall<notifications_pb.GetNotificationSettingsRequest, notifications_pb.GetNotificationSettingsResponse>;
    updateUserLocale: grpc.handleUnaryCall<notifications_pb.UpdateUserLocaleRequest, notifications_pb.UpdateUserLocaleResponse>;
}

export interface INotificationsServiceClient {
    shouldSendNotification(request: notifications_pb.ShouldSendNotificationRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.ShouldSendNotificationResponse) => void): grpc.ClientUnaryCall;
    shouldSendNotification(request: notifications_pb.ShouldSendNotificationRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.ShouldSendNotificationResponse) => void): grpc.ClientUnaryCall;
    shouldSendNotification(request: notifications_pb.ShouldSendNotificationRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.ShouldSendNotificationResponse) => void): grpc.ClientUnaryCall;
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
}

export class NotificationsServiceClient extends grpc.Client implements INotificationsServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public shouldSendNotification(request: notifications_pb.ShouldSendNotificationRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.ShouldSendNotificationResponse) => void): grpc.ClientUnaryCall;
    public shouldSendNotification(request: notifications_pb.ShouldSendNotificationRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.ShouldSendNotificationResponse) => void): grpc.ClientUnaryCall;
    public shouldSendNotification(request: notifications_pb.ShouldSendNotificationRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.ShouldSendNotificationResponse) => void): grpc.ClientUnaryCall;
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
}
