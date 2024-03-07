// package: services.notifications.v1
// file: notifications.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class ShouldSendNotificationRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): ShouldSendNotificationRequest;
    getChannel(): NotificationChannel;
    setChannel(value: NotificationChannel): ShouldSendNotificationRequest;
    getCategory(): NotificationCategory;
    setCategory(value: NotificationCategory): ShouldSendNotificationRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ShouldSendNotificationRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ShouldSendNotificationRequest): ShouldSendNotificationRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ShouldSendNotificationRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ShouldSendNotificationRequest;
    static deserializeBinaryFromReader(message: ShouldSendNotificationRequest, reader: jspb.BinaryReader): ShouldSendNotificationRequest;
}

export namespace ShouldSendNotificationRequest {
    export type AsObject = {
        userId: string,
        channel: NotificationChannel,
        category: NotificationCategory,
    }
}

export class ShouldSendNotificationResponse extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): ShouldSendNotificationResponse;
    getShouldSend(): boolean;
    setShouldSend(value: boolean): ShouldSendNotificationResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ShouldSendNotificationResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ShouldSendNotificationResponse): ShouldSendNotificationResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ShouldSendNotificationResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ShouldSendNotificationResponse;
    static deserializeBinaryFromReader(message: ShouldSendNotificationResponse, reader: jspb.BinaryReader): ShouldSendNotificationResponse;
}

export namespace ShouldSendNotificationResponse {
    export type AsObject = {
        userId: string,
        shouldSend: boolean,
    }
}

export class EnableNotificationChannelRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): EnableNotificationChannelRequest;
    getChannel(): NotificationChannel;
    setChannel(value: NotificationChannel): EnableNotificationChannelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EnableNotificationChannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: EnableNotificationChannelRequest): EnableNotificationChannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EnableNotificationChannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EnableNotificationChannelRequest;
    static deserializeBinaryFromReader(message: EnableNotificationChannelRequest, reader: jspb.BinaryReader): EnableNotificationChannelRequest;
}

export namespace EnableNotificationChannelRequest {
    export type AsObject = {
        userId: string,
        channel: NotificationChannel,
    }
}

export class EnableNotificationChannelResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): NotificationSettings | undefined;
    setNotificationSettings(value?: NotificationSettings): EnableNotificationChannelResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EnableNotificationChannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: EnableNotificationChannelResponse): EnableNotificationChannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EnableNotificationChannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EnableNotificationChannelResponse;
    static deserializeBinaryFromReader(message: EnableNotificationChannelResponse, reader: jspb.BinaryReader): EnableNotificationChannelResponse;
}

export namespace EnableNotificationChannelResponse {
    export type AsObject = {
        notificationSettings?: NotificationSettings.AsObject,
    }
}

export class NotificationSettings extends jspb.Message { 

    hasPush(): boolean;
    clearPush(): void;
    getPush(): ChannelNotificationSettings | undefined;
    setPush(value?: ChannelNotificationSettings): NotificationSettings;

    hasLocale(): boolean;
    clearLocale(): void;
    getLocale(): string | undefined;
    setLocale(value: string): NotificationSettings;
    clearPushDeviceTokensList(): void;
    getPushDeviceTokensList(): Array<string>;
    setPushDeviceTokensList(value: Array<string>): NotificationSettings;
    addPushDeviceTokens(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NotificationSettings.AsObject;
    static toObject(includeInstance: boolean, msg: NotificationSettings): NotificationSettings.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NotificationSettings, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NotificationSettings;
    static deserializeBinaryFromReader(message: NotificationSettings, reader: jspb.BinaryReader): NotificationSettings;
}

export namespace NotificationSettings {
    export type AsObject = {
        push?: ChannelNotificationSettings.AsObject,
        locale?: string,
        pushDeviceTokensList: Array<string>,
    }
}

export class ChannelNotificationSettings extends jspb.Message { 
    getEnabled(): boolean;
    setEnabled(value: boolean): ChannelNotificationSettings;
    clearDisabledCategoriesList(): void;
    getDisabledCategoriesList(): Array<NotificationCategory>;
    setDisabledCategoriesList(value: Array<NotificationCategory>): ChannelNotificationSettings;
    addDisabledCategories(value: NotificationCategory, index?: number): NotificationCategory;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ChannelNotificationSettings.AsObject;
    static toObject(includeInstance: boolean, msg: ChannelNotificationSettings): ChannelNotificationSettings.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ChannelNotificationSettings, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ChannelNotificationSettings;
    static deserializeBinaryFromReader(message: ChannelNotificationSettings, reader: jspb.BinaryReader): ChannelNotificationSettings;
}

export namespace ChannelNotificationSettings {
    export type AsObject = {
        enabled: boolean,
        disabledCategoriesList: Array<NotificationCategory>,
    }
}

export class DisableNotificationChannelRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): DisableNotificationChannelRequest;
    getChannel(): NotificationChannel;
    setChannel(value: NotificationChannel): DisableNotificationChannelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisableNotificationChannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DisableNotificationChannelRequest): DisableNotificationChannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisableNotificationChannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisableNotificationChannelRequest;
    static deserializeBinaryFromReader(message: DisableNotificationChannelRequest, reader: jspb.BinaryReader): DisableNotificationChannelRequest;
}

export namespace DisableNotificationChannelRequest {
    export type AsObject = {
        userId: string,
        channel: NotificationChannel,
    }
}

export class DisableNotificationChannelResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): NotificationSettings | undefined;
    setNotificationSettings(value?: NotificationSettings): DisableNotificationChannelResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisableNotificationChannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DisableNotificationChannelResponse): DisableNotificationChannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisableNotificationChannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisableNotificationChannelResponse;
    static deserializeBinaryFromReader(message: DisableNotificationChannelResponse, reader: jspb.BinaryReader): DisableNotificationChannelResponse;
}

export namespace DisableNotificationChannelResponse {
    export type AsObject = {
        notificationSettings?: NotificationSettings.AsObject,
    }
}

export class DisableNotificationCategoryRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): DisableNotificationCategoryRequest;
    getChannel(): NotificationChannel;
    setChannel(value: NotificationChannel): DisableNotificationCategoryRequest;
    getCategory(): NotificationCategory;
    setCategory(value: NotificationCategory): DisableNotificationCategoryRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisableNotificationCategoryRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DisableNotificationCategoryRequest): DisableNotificationCategoryRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisableNotificationCategoryRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisableNotificationCategoryRequest;
    static deserializeBinaryFromReader(message: DisableNotificationCategoryRequest, reader: jspb.BinaryReader): DisableNotificationCategoryRequest;
}

export namespace DisableNotificationCategoryRequest {
    export type AsObject = {
        userId: string,
        channel: NotificationChannel,
        category: NotificationCategory,
    }
}

export class DisableNotificationCategoryResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): NotificationSettings | undefined;
    setNotificationSettings(value?: NotificationSettings): DisableNotificationCategoryResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisableNotificationCategoryResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DisableNotificationCategoryResponse): DisableNotificationCategoryResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisableNotificationCategoryResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisableNotificationCategoryResponse;
    static deserializeBinaryFromReader(message: DisableNotificationCategoryResponse, reader: jspb.BinaryReader): DisableNotificationCategoryResponse;
}

export namespace DisableNotificationCategoryResponse {
    export type AsObject = {
        notificationSettings?: NotificationSettings.AsObject,
    }
}

export class EnableNotificationCategoryRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): EnableNotificationCategoryRequest;
    getChannel(): NotificationChannel;
    setChannel(value: NotificationChannel): EnableNotificationCategoryRequest;
    getCategory(): NotificationCategory;
    setCategory(value: NotificationCategory): EnableNotificationCategoryRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EnableNotificationCategoryRequest.AsObject;
    static toObject(includeInstance: boolean, msg: EnableNotificationCategoryRequest): EnableNotificationCategoryRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EnableNotificationCategoryRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EnableNotificationCategoryRequest;
    static deserializeBinaryFromReader(message: EnableNotificationCategoryRequest, reader: jspb.BinaryReader): EnableNotificationCategoryRequest;
}

export namespace EnableNotificationCategoryRequest {
    export type AsObject = {
        userId: string,
        channel: NotificationChannel,
        category: NotificationCategory,
    }
}

export class EnableNotificationCategoryResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): NotificationSettings | undefined;
    setNotificationSettings(value?: NotificationSettings): EnableNotificationCategoryResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EnableNotificationCategoryResponse.AsObject;
    static toObject(includeInstance: boolean, msg: EnableNotificationCategoryResponse): EnableNotificationCategoryResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EnableNotificationCategoryResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EnableNotificationCategoryResponse;
    static deserializeBinaryFromReader(message: EnableNotificationCategoryResponse, reader: jspb.BinaryReader): EnableNotificationCategoryResponse;
}

export namespace EnableNotificationCategoryResponse {
    export type AsObject = {
        notificationSettings?: NotificationSettings.AsObject,
    }
}

export class GetNotificationSettingsRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): GetNotificationSettingsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetNotificationSettingsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetNotificationSettingsRequest): GetNotificationSettingsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetNotificationSettingsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetNotificationSettingsRequest;
    static deserializeBinaryFromReader(message: GetNotificationSettingsRequest, reader: jspb.BinaryReader): GetNotificationSettingsRequest;
}

export namespace GetNotificationSettingsRequest {
    export type AsObject = {
        userId: string,
    }
}

export class GetNotificationSettingsResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): NotificationSettings | undefined;
    setNotificationSettings(value?: NotificationSettings): GetNotificationSettingsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetNotificationSettingsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetNotificationSettingsResponse): GetNotificationSettingsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetNotificationSettingsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetNotificationSettingsResponse;
    static deserializeBinaryFromReader(message: GetNotificationSettingsResponse, reader: jspb.BinaryReader): GetNotificationSettingsResponse;
}

export namespace GetNotificationSettingsResponse {
    export type AsObject = {
        notificationSettings?: NotificationSettings.AsObject,
    }
}

export class UpdateUserLocaleRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): UpdateUserLocaleRequest;
    getLocale(): string;
    setLocale(value: string): UpdateUserLocaleRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateUserLocaleRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateUserLocaleRequest): UpdateUserLocaleRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateUserLocaleRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateUserLocaleRequest;
    static deserializeBinaryFromReader(message: UpdateUserLocaleRequest, reader: jspb.BinaryReader): UpdateUserLocaleRequest;
}

export namespace UpdateUserLocaleRequest {
    export type AsObject = {
        userId: string,
        locale: string,
    }
}

export class UpdateUserLocaleResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): NotificationSettings | undefined;
    setNotificationSettings(value?: NotificationSettings): UpdateUserLocaleResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateUserLocaleResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateUserLocaleResponse): UpdateUserLocaleResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateUserLocaleResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateUserLocaleResponse;
    static deserializeBinaryFromReader(message: UpdateUserLocaleResponse, reader: jspb.BinaryReader): UpdateUserLocaleResponse;
}

export namespace UpdateUserLocaleResponse {
    export type AsObject = {
        notificationSettings?: NotificationSettings.AsObject,
    }
}

export class AddPushDeviceTokenRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): AddPushDeviceTokenRequest;
    getDeviceToken(): string;
    setDeviceToken(value: string): AddPushDeviceTokenRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddPushDeviceTokenRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AddPushDeviceTokenRequest): AddPushDeviceTokenRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddPushDeviceTokenRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddPushDeviceTokenRequest;
    static deserializeBinaryFromReader(message: AddPushDeviceTokenRequest, reader: jspb.BinaryReader): AddPushDeviceTokenRequest;
}

export namespace AddPushDeviceTokenRequest {
    export type AsObject = {
        userId: string,
        deviceToken: string,
    }
}

export class AddPushDeviceTokenResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): NotificationSettings | undefined;
    setNotificationSettings(value?: NotificationSettings): AddPushDeviceTokenResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddPushDeviceTokenResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AddPushDeviceTokenResponse): AddPushDeviceTokenResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddPushDeviceTokenResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddPushDeviceTokenResponse;
    static deserializeBinaryFromReader(message: AddPushDeviceTokenResponse, reader: jspb.BinaryReader): AddPushDeviceTokenResponse;
}

export namespace AddPushDeviceTokenResponse {
    export type AsObject = {
        notificationSettings?: NotificationSettings.AsObject,
    }
}

export class RemovePushDeviceTokenRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): RemovePushDeviceTokenRequest;
    getDeviceToken(): string;
    setDeviceToken(value: string): RemovePushDeviceTokenRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RemovePushDeviceTokenRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RemovePushDeviceTokenRequest): RemovePushDeviceTokenRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RemovePushDeviceTokenRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RemovePushDeviceTokenRequest;
    static deserializeBinaryFromReader(message: RemovePushDeviceTokenRequest, reader: jspb.BinaryReader): RemovePushDeviceTokenRequest;
}

export namespace RemovePushDeviceTokenRequest {
    export type AsObject = {
        userId: string,
        deviceToken: string,
    }
}

export class RemovePushDeviceTokenResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): NotificationSettings | undefined;
    setNotificationSettings(value?: NotificationSettings): RemovePushDeviceTokenResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RemovePushDeviceTokenResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RemovePushDeviceTokenResponse): RemovePushDeviceTokenResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RemovePushDeviceTokenResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RemovePushDeviceTokenResponse;
    static deserializeBinaryFromReader(message: RemovePushDeviceTokenResponse, reader: jspb.BinaryReader): RemovePushDeviceTokenResponse;
}

export namespace RemovePushDeviceTokenResponse {
    export type AsObject = {
        notificationSettings?: NotificationSettings.AsObject,
    }
}

export class UpdateEmailAddressRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): UpdateEmailAddressRequest;
    getEmailAddress(): string;
    setEmailAddress(value: string): UpdateEmailAddressRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateEmailAddressRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateEmailAddressRequest): UpdateEmailAddressRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateEmailAddressRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateEmailAddressRequest;
    static deserializeBinaryFromReader(message: UpdateEmailAddressRequest, reader: jspb.BinaryReader): UpdateEmailAddressRequest;
}

export namespace UpdateEmailAddressRequest {
    export type AsObject = {
        userId: string,
        emailAddress: string,
    }
}

export class UpdateEmailAddressResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateEmailAddressResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateEmailAddressResponse): UpdateEmailAddressResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateEmailAddressResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateEmailAddressResponse;
    static deserializeBinaryFromReader(message: UpdateEmailAddressResponse, reader: jspb.BinaryReader): UpdateEmailAddressResponse;
}

export namespace UpdateEmailAddressResponse {
    export type AsObject = {
    }
}

export class RemoveEmailAddressRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): RemoveEmailAddressRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RemoveEmailAddressRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RemoveEmailAddressRequest): RemoveEmailAddressRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RemoveEmailAddressRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RemoveEmailAddressRequest;
    static deserializeBinaryFromReader(message: RemoveEmailAddressRequest, reader: jspb.BinaryReader): RemoveEmailAddressRequest;
}

export namespace RemoveEmailAddressRequest {
    export type AsObject = {
        userId: string,
    }
}

export class RemoveEmailAddressResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RemoveEmailAddressResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RemoveEmailAddressResponse): RemoveEmailAddressResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RemoveEmailAddressResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RemoveEmailAddressResponse;
    static deserializeBinaryFromReader(message: RemoveEmailAddressResponse, reader: jspb.BinaryReader): RemoveEmailAddressResponse;
}

export namespace RemoveEmailAddressResponse {
    export type AsObject = {
    }
}

export class HandleNotificationEventRequest extends jspb.Message { 

    hasEvent(): boolean;
    clearEvent(): void;
    getEvent(): NotificationEvent | undefined;
    setEvent(value?: NotificationEvent): HandleNotificationEventRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HandleNotificationEventRequest.AsObject;
    static toObject(includeInstance: boolean, msg: HandleNotificationEventRequest): HandleNotificationEventRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HandleNotificationEventRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HandleNotificationEventRequest;
    static deserializeBinaryFromReader(message: HandleNotificationEventRequest, reader: jspb.BinaryReader): HandleNotificationEventRequest;
}

export namespace HandleNotificationEventRequest {
    export type AsObject = {
        event?: NotificationEvent.AsObject,
    }
}

export class HandleNotificationEventResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HandleNotificationEventResponse.AsObject;
    static toObject(includeInstance: boolean, msg: HandleNotificationEventResponse): HandleNotificationEventResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HandleNotificationEventResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HandleNotificationEventResponse;
    static deserializeBinaryFromReader(message: HandleNotificationEventResponse, reader: jspb.BinaryReader): HandleNotificationEventResponse;
}

export namespace HandleNotificationEventResponse {
    export type AsObject = {
    }
}

export class NotificationEvent extends jspb.Message { 

    hasCircleGrew(): boolean;
    clearCircleGrew(): void;
    getCircleGrew(): CircleGrew | undefined;
    setCircleGrew(value?: CircleGrew): NotificationEvent;

    hasCircleThresholdReached(): boolean;
    clearCircleThresholdReached(): void;
    getCircleThresholdReached(): CircleThresholdReached | undefined;
    setCircleThresholdReached(value?: CircleThresholdReached): NotificationEvent;

    hasIdentityVerificationApproved(): boolean;
    clearIdentityVerificationApproved(): void;
    getIdentityVerificationApproved(): IdentityVerificationApproved | undefined;
    setIdentityVerificationApproved(value?: IdentityVerificationApproved): NotificationEvent;

    hasIdentityVerificationDeclined(): boolean;
    clearIdentityVerificationDeclined(): void;
    getIdentityVerificationDeclined(): IdentityVerificationDeclined | undefined;
    setIdentityVerificationDeclined(value?: IdentityVerificationDeclined): NotificationEvent;

    hasIdentityVerificationReviewStarted(): boolean;
    clearIdentityVerificationReviewStarted(): void;
    getIdentityVerificationReviewStarted(): IdentityVerificationReviewStarted | undefined;
    setIdentityVerificationReviewStarted(value?: IdentityVerificationReviewStarted): NotificationEvent;

    hasTransactionOccurred(): boolean;
    clearTransactionOccurred(): void;
    getTransactionOccurred(): TransactionOccurred | undefined;
    setTransactionOccurred(value?: TransactionOccurred): NotificationEvent;

    hasPrice(): boolean;
    clearPrice(): void;
    getPrice(): PriceChanged | undefined;
    setPrice(value?: PriceChanged): NotificationEvent;

    getDataCase(): NotificationEvent.DataCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NotificationEvent.AsObject;
    static toObject(includeInstance: boolean, msg: NotificationEvent): NotificationEvent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NotificationEvent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NotificationEvent;
    static deserializeBinaryFromReader(message: NotificationEvent, reader: jspb.BinaryReader): NotificationEvent;
}

export namespace NotificationEvent {
    export type AsObject = {
        circleGrew?: CircleGrew.AsObject,
        circleThresholdReached?: CircleThresholdReached.AsObject,
        identityVerificationApproved?: IdentityVerificationApproved.AsObject,
        identityVerificationDeclined?: IdentityVerificationDeclined.AsObject,
        identityVerificationReviewStarted?: IdentityVerificationReviewStarted.AsObject,
        transactionOccurred?: TransactionOccurred.AsObject,
        price?: PriceChanged.AsObject,
    }

    export enum DataCase {
        DATA_NOT_SET = 0,
        CIRCLE_GREW = 1,
        CIRCLE_THRESHOLD_REACHED = 2,
        IDENTITY_VERIFICATION_APPROVED = 3,
        IDENTITY_VERIFICATION_DECLINED = 4,
        IDENTITY_VERIFICATION_REVIEW_STARTED = 5,
        TRANSACTION_OCCURRED = 6,
        PRICE = 7,
    }

}

export class CircleGrew extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): CircleGrew;
    getCircleType(): CircleType;
    setCircleType(value: CircleType): CircleGrew;
    getThisMonthCircleSize(): number;
    setThisMonthCircleSize(value: number): CircleGrew;
    getAllTimeCircleSize(): number;
    setAllTimeCircleSize(value: number): CircleGrew;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CircleGrew.AsObject;
    static toObject(includeInstance: boolean, msg: CircleGrew): CircleGrew.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CircleGrew, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CircleGrew;
    static deserializeBinaryFromReader(message: CircleGrew, reader: jspb.BinaryReader): CircleGrew;
}

export namespace CircleGrew {
    export type AsObject = {
        userId: string,
        circleType: CircleType,
        thisMonthCircleSize: number,
        allTimeCircleSize: number,
    }
}

export class CircleThresholdReached extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): CircleThresholdReached;
    getCircleType(): CircleType;
    setCircleType(value: CircleType): CircleThresholdReached;
    getTimeFrame(): CircleTimeFrame;
    setTimeFrame(value: CircleTimeFrame): CircleThresholdReached;
    getThreshold(): number;
    setThreshold(value: number): CircleThresholdReached;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CircleThresholdReached.AsObject;
    static toObject(includeInstance: boolean, msg: CircleThresholdReached): CircleThresholdReached.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CircleThresholdReached, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CircleThresholdReached;
    static deserializeBinaryFromReader(message: CircleThresholdReached, reader: jspb.BinaryReader): CircleThresholdReached;
}

export namespace CircleThresholdReached {
    export type AsObject = {
        userId: string,
        circleType: CircleType,
        timeFrame: CircleTimeFrame,
        threshold: number,
    }
}

export class IdentityVerificationApproved extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): IdentityVerificationApproved;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IdentityVerificationApproved.AsObject;
    static toObject(includeInstance: boolean, msg: IdentityVerificationApproved): IdentityVerificationApproved.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IdentityVerificationApproved, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IdentityVerificationApproved;
    static deserializeBinaryFromReader(message: IdentityVerificationApproved, reader: jspb.BinaryReader): IdentityVerificationApproved;
}

export namespace IdentityVerificationApproved {
    export type AsObject = {
        userId: string,
    }
}

export class IdentityVerificationDeclined extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): IdentityVerificationDeclined;
    getDeclinedReason(): DeclinedReason;
    setDeclinedReason(value: DeclinedReason): IdentityVerificationDeclined;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IdentityVerificationDeclined.AsObject;
    static toObject(includeInstance: boolean, msg: IdentityVerificationDeclined): IdentityVerificationDeclined.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IdentityVerificationDeclined, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IdentityVerificationDeclined;
    static deserializeBinaryFromReader(message: IdentityVerificationDeclined, reader: jspb.BinaryReader): IdentityVerificationDeclined;
}

export namespace IdentityVerificationDeclined {
    export type AsObject = {
        userId: string,
        declinedReason: DeclinedReason,
    }
}

export class IdentityVerificationReviewStarted extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): IdentityVerificationReviewStarted;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IdentityVerificationReviewStarted.AsObject;
    static toObject(includeInstance: boolean, msg: IdentityVerificationReviewStarted): IdentityVerificationReviewStarted.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IdentityVerificationReviewStarted, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IdentityVerificationReviewStarted;
    static deserializeBinaryFromReader(message: IdentityVerificationReviewStarted, reader: jspb.BinaryReader): IdentityVerificationReviewStarted;
}

export namespace IdentityVerificationReviewStarted {
    export type AsObject = {
        userId: string,
    }
}

export class TransactionOccurred extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): TransactionOccurred;
    getType(): TransactionType;
    setType(value: TransactionType): TransactionOccurred;

    hasSettlementAmount(): boolean;
    clearSettlementAmount(): void;
    getSettlementAmount(): Money | undefined;
    setSettlementAmount(value?: Money): TransactionOccurred;

    hasDisplayAmount(): boolean;
    clearDisplayAmount(): void;
    getDisplayAmount(): Money | undefined;
    setDisplayAmount(value?: Money): TransactionOccurred;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TransactionOccurred.AsObject;
    static toObject(includeInstance: boolean, msg: TransactionOccurred): TransactionOccurred.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TransactionOccurred, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TransactionOccurred;
    static deserializeBinaryFromReader(message: TransactionOccurred, reader: jspb.BinaryReader): TransactionOccurred;
}

export namespace TransactionOccurred {
    export type AsObject = {
        userId: string,
        type: TransactionType,
        settlementAmount?: Money.AsObject,
        displayAmount?: Money.AsObject,
    }
}

export class Money extends jspb.Message { 
    getCurrencyCode(): string;
    setCurrencyCode(value: string): Money;
    getMinorUnits(): number;
    setMinorUnits(value: number): Money;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Money.AsObject;
    static toObject(includeInstance: boolean, msg: Money): Money.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Money, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Money;
    static deserializeBinaryFromReader(message: Money, reader: jspb.BinaryReader): Money;
}

export namespace Money {
    export type AsObject = {
        currencyCode: string,
        minorUnits: number,
    }
}

export class PriceChanged extends jspb.Message { 

    hasPriceOfOneBitcoin(): boolean;
    clearPriceOfOneBitcoin(): void;
    getPriceOfOneBitcoin(): Money | undefined;
    setPriceOfOneBitcoin(value?: Money): PriceChanged;
    getDirection(): PriceChangeDirection;
    setDirection(value: PriceChangeDirection): PriceChanged;
    getPriceChangePercentage(): number;
    setPriceChangePercentage(value: number): PriceChanged;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PriceChanged.AsObject;
    static toObject(includeInstance: boolean, msg: PriceChanged): PriceChanged.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PriceChanged, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PriceChanged;
    static deserializeBinaryFromReader(message: PriceChanged, reader: jspb.BinaryReader): PriceChanged;
}

export namespace PriceChanged {
    export type AsObject = {
        priceOfOneBitcoin?: Money.AsObject,
        direction: PriceChangeDirection,
        priceChangePercentage: number,
    }
}

export enum NotificationChannel {
    PUSH = 0,
}

export enum NotificationCategory {
    CIRCLES = 0,
    PAYMENTS = 1,
    BALANCE = 2,
    ADMIN_NOTIFICATION = 3,
}

export enum CircleType {
    INNER = 0,
    OUTER = 1,
}

export enum CircleTimeFrame {
    MONTH = 0,
    ALL_TIME = 1,
}

export enum DeclinedReason {
    DOCUMENTS_NOT_CLEAR = 0,
    VERIFICATION_PHOTO_NOT_CLEAR = 1,
    DOCUMENTS_NOT_SUPPORTED = 2,
    DOCUMENTS_EXPIRED = 3,
    DOCUMENTS_DO_NOT_MATCH = 4,
    OTHER = 5,
}

export enum TransactionType {
    INTRA_LEDGER_RECEIPT = 0,
    INTRA_LEDGER_PAYMENT = 1,
    ONCHAIN_RECEIPT = 2,
    ONCHAIN_RECEIPT_PENDING = 3,
    ONCHAIN_PAYMENT = 4,
    LIGHTNING_RECEIPT = 5,
    LIGHTNING_PAYMENT = 6,
}

export enum PriceChangeDirection {
    UP = 0,
    DOWN = 1,
}
