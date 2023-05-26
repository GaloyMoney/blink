// package: services.bria.v1
// file: bria.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class CreateProfileRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateProfileRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateProfileRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateProfileRequest): CreateProfileRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateProfileRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateProfileRequest;
    static deserializeBinaryFromReader(message: CreateProfileRequest, reader: jspb.BinaryReader): CreateProfileRequest;
}

export namespace CreateProfileRequest {
    export type AsObject = {
        name: string,
    }
}

export class CreateProfileResponse extends jspb.Message { 
    getId(): string;
    setId(value: string): CreateProfileResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateProfileResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateProfileResponse): CreateProfileResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateProfileResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateProfileResponse;
    static deserializeBinaryFromReader(message: CreateProfileResponse, reader: jspb.BinaryReader): CreateProfileResponse;
}

export namespace CreateProfileResponse {
    export type AsObject = {
        id: string,
    }
}

export class CreateProfileApiKeyRequest extends jspb.Message { 
    getProfileName(): string;
    setProfileName(value: string): CreateProfileApiKeyRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateProfileApiKeyRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateProfileApiKeyRequest): CreateProfileApiKeyRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateProfileApiKeyRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateProfileApiKeyRequest;
    static deserializeBinaryFromReader(message: CreateProfileApiKeyRequest, reader: jspb.BinaryReader): CreateProfileApiKeyRequest;
}

export namespace CreateProfileApiKeyRequest {
    export type AsObject = {
        profileName: string,
    }
}

export class CreateProfileApiKeyResponse extends jspb.Message { 
    getId(): string;
    setId(value: string): CreateProfileApiKeyResponse;
    getKey(): string;
    setKey(value: string): CreateProfileApiKeyResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateProfileApiKeyResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateProfileApiKeyResponse): CreateProfileApiKeyResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateProfileApiKeyResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateProfileApiKeyResponse;
    static deserializeBinaryFromReader(message: CreateProfileApiKeyResponse, reader: jspb.BinaryReader): CreateProfileApiKeyResponse;
}

export namespace CreateProfileApiKeyResponse {
    export type AsObject = {
        id: string,
        key: string,
    }
}

export class ListProfilesRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListProfilesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListProfilesRequest): ListProfilesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListProfilesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListProfilesRequest;
    static deserializeBinaryFromReader(message: ListProfilesRequest, reader: jspb.BinaryReader): ListProfilesRequest;
}

export namespace ListProfilesRequest {
    export type AsObject = {
    }
}

export class Profile extends jspb.Message { 
    getId(): string;
    setId(value: string): Profile;
    getName(): string;
    setName(value: string): Profile;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Profile.AsObject;
    static toObject(includeInstance: boolean, msg: Profile): Profile.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Profile, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Profile;
    static deserializeBinaryFromReader(message: Profile, reader: jspb.BinaryReader): Profile;
}

export namespace Profile {
    export type AsObject = {
        id: string,
        name: string,
    }
}

export class ListProfilesResponse extends jspb.Message { 
    clearProfilesList(): void;
    getProfilesList(): Array<Profile>;
    setProfilesList(value: Array<Profile>): ListProfilesResponse;
    addProfiles(value?: Profile, index?: number): Profile;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListProfilesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListProfilesResponse): ListProfilesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListProfilesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListProfilesResponse;
    static deserializeBinaryFromReader(message: ListProfilesResponse, reader: jspb.BinaryReader): ListProfilesResponse;
}

export namespace ListProfilesResponse {
    export type AsObject = {
        profilesList: Array<Profile.AsObject>,
    }
}

export class ImportXpubRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): ImportXpubRequest;
    getXpub(): string;
    setXpub(value: string): ImportXpubRequest;
    getDerivation(): string;
    setDerivation(value: string): ImportXpubRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ImportXpubRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ImportXpubRequest): ImportXpubRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ImportXpubRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ImportXpubRequest;
    static deserializeBinaryFromReader(message: ImportXpubRequest, reader: jspb.BinaryReader): ImportXpubRequest;
}

export namespace ImportXpubRequest {
    export type AsObject = {
        name: string,
        xpub: string,
        derivation: string,
    }
}

export class ImportXpubResponse extends jspb.Message { 
    getId(): string;
    setId(value: string): ImportXpubResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ImportXpubResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ImportXpubResponse): ImportXpubResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ImportXpubResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ImportXpubResponse;
    static deserializeBinaryFromReader(message: ImportXpubResponse, reader: jspb.BinaryReader): ImportXpubResponse;
}

export namespace ImportXpubResponse {
    export type AsObject = {
        id: string,
    }
}

export class SetSignerConfigRequest extends jspb.Message { 
    getXpubRef(): string;
    setXpubRef(value: string): SetSignerConfigRequest;

    hasLnd(): boolean;
    clearLnd(): void;
    getLnd(): LndSignerConfig | undefined;
    setLnd(value?: LndSignerConfig): SetSignerConfigRequest;

    hasBitcoind(): boolean;
    clearBitcoind(): void;
    getBitcoind(): BitcoindSignerConfig | undefined;
    setBitcoind(value?: BitcoindSignerConfig): SetSignerConfigRequest;

    getConfigCase(): SetSignerConfigRequest.ConfigCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetSignerConfigRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SetSignerConfigRequest): SetSignerConfigRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetSignerConfigRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetSignerConfigRequest;
    static deserializeBinaryFromReader(message: SetSignerConfigRequest, reader: jspb.BinaryReader): SetSignerConfigRequest;
}

export namespace SetSignerConfigRequest {
    export type AsObject = {
        xpubRef: string,
        lnd?: LndSignerConfig.AsObject,
        bitcoind?: BitcoindSignerConfig.AsObject,
    }

    export enum ConfigCase {
        CONFIG_NOT_SET = 0,
        LND = 2,
        BITCOIND = 3,
    }

}

export class LndSignerConfig extends jspb.Message { 
    getEndpoint(): string;
    setEndpoint(value: string): LndSignerConfig;
    getCertBase64(): string;
    setCertBase64(value: string): LndSignerConfig;
    getMacaroonBase64(): string;
    setMacaroonBase64(value: string): LndSignerConfig;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LndSignerConfig.AsObject;
    static toObject(includeInstance: boolean, msg: LndSignerConfig): LndSignerConfig.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LndSignerConfig, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LndSignerConfig;
    static deserializeBinaryFromReader(message: LndSignerConfig, reader: jspb.BinaryReader): LndSignerConfig;
}

export namespace LndSignerConfig {
    export type AsObject = {
        endpoint: string,
        certBase64: string,
        macaroonBase64: string,
    }
}

export class BitcoindSignerConfig extends jspb.Message { 
    getEndpoint(): string;
    setEndpoint(value: string): BitcoindSignerConfig;
    getRpcUser(): string;
    setRpcUser(value: string): BitcoindSignerConfig;
    getRpcPassword(): string;
    setRpcPassword(value: string): BitcoindSignerConfig;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BitcoindSignerConfig.AsObject;
    static toObject(includeInstance: boolean, msg: BitcoindSignerConfig): BitcoindSignerConfig.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BitcoindSignerConfig, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BitcoindSignerConfig;
    static deserializeBinaryFromReader(message: BitcoindSignerConfig, reader: jspb.BinaryReader): BitcoindSignerConfig;
}

export namespace BitcoindSignerConfig {
    export type AsObject = {
        endpoint: string,
        rpcUser: string,
        rpcPassword: string,
    }
}

export class SetSignerConfigResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetSignerConfigResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SetSignerConfigResponse): SetSignerConfigResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetSignerConfigResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetSignerConfigResponse;
    static deserializeBinaryFromReader(message: SetSignerConfigResponse, reader: jspb.BinaryReader): SetSignerConfigResponse;
}

export namespace SetSignerConfigResponse {
    export type AsObject = {
    }
}

export class KeychainConfig extends jspb.Message { 

    hasWpkh(): boolean;
    clearWpkh(): void;
    getWpkh(): KeychainConfig.Wpkh | undefined;
    setWpkh(value?: KeychainConfig.Wpkh): KeychainConfig;

    hasDescriptors(): boolean;
    clearDescriptors(): void;
    getDescriptors(): KeychainConfig.Descriptors | undefined;
    setDescriptors(value?: KeychainConfig.Descriptors): KeychainConfig;

    getConfigCase(): KeychainConfig.ConfigCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeychainConfig.AsObject;
    static toObject(includeInstance: boolean, msg: KeychainConfig): KeychainConfig.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeychainConfig, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeychainConfig;
    static deserializeBinaryFromReader(message: KeychainConfig, reader: jspb.BinaryReader): KeychainConfig;
}

export namespace KeychainConfig {
    export type AsObject = {
        wpkh?: KeychainConfig.Wpkh.AsObject,
        descriptors?: KeychainConfig.Descriptors.AsObject,
    }


    export class Wpkh extends jspb.Message { 
        getXpub(): string;
        setXpub(value: string): Wpkh;

        hasDerivationPath(): boolean;
        clearDerivationPath(): void;
        getDerivationPath(): string | undefined;
        setDerivationPath(value: string): Wpkh;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Wpkh.AsObject;
        static toObject(includeInstance: boolean, msg: Wpkh): Wpkh.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Wpkh, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Wpkh;
        static deserializeBinaryFromReader(message: Wpkh, reader: jspb.BinaryReader): Wpkh;
    }

    export namespace Wpkh {
        export type AsObject = {
            xpub: string,
            derivationPath?: string,
        }
    }

    export class Descriptors extends jspb.Message { 
        getExternal(): string;
        setExternal(value: string): Descriptors;
        getInternal(): string;
        setInternal(value: string): Descriptors;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Descriptors.AsObject;
        static toObject(includeInstance: boolean, msg: Descriptors): Descriptors.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Descriptors, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Descriptors;
        static deserializeBinaryFromReader(message: Descriptors, reader: jspb.BinaryReader): Descriptors;
    }

    export namespace Descriptors {
        export type AsObject = {
            external: string,
            internal: string,
        }
    }


    export enum ConfigCase {
        CONFIG_NOT_SET = 0,
        WPKH = 1,
        DESCRIPTORS = 2,
    }

}

export class CreateWalletRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateWalletRequest;

    hasKeychainConfig(): boolean;
    clearKeychainConfig(): void;
    getKeychainConfig(): KeychainConfig | undefined;
    setKeychainConfig(value?: KeychainConfig): CreateWalletRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateWalletRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateWalletRequest): CreateWalletRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateWalletRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateWalletRequest;
    static deserializeBinaryFromReader(message: CreateWalletRequest, reader: jspb.BinaryReader): CreateWalletRequest;
}

export namespace CreateWalletRequest {
    export type AsObject = {
        name: string,
        keychainConfig?: KeychainConfig.AsObject,
    }
}

export class CreateWalletResponse extends jspb.Message { 
    getId(): string;
    setId(value: string): CreateWalletResponse;
    clearXpubIdsList(): void;
    getXpubIdsList(): Array<string>;
    setXpubIdsList(value: Array<string>): CreateWalletResponse;
    addXpubIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateWalletResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateWalletResponse): CreateWalletResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateWalletResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateWalletResponse;
    static deserializeBinaryFromReader(message: CreateWalletResponse, reader: jspb.BinaryReader): CreateWalletResponse;
}

export namespace CreateWalletResponse {
    export type AsObject = {
        id: string,
        xpubIdsList: Array<string>,
    }
}

export class ListWalletsRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListWalletsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListWalletsRequest): ListWalletsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListWalletsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListWalletsRequest;
    static deserializeBinaryFromReader(message: ListWalletsRequest, reader: jspb.BinaryReader): ListWalletsRequest;
}

export namespace ListWalletsRequest {
    export type AsObject = {
    }
}

export class ListWalletsResponse extends jspb.Message { 
    clearWalletsList(): void;
    getWalletsList(): Array<Wallet>;
    setWalletsList(value: Array<Wallet>): ListWalletsResponse;
    addWallets(value?: Wallet, index?: number): Wallet;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListWalletsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListWalletsResponse): ListWalletsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListWalletsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListWalletsResponse;
    static deserializeBinaryFromReader(message: ListWalletsResponse, reader: jspb.BinaryReader): ListWalletsResponse;
}

export namespace ListWalletsResponse {
    export type AsObject = {
        walletsList: Array<Wallet.AsObject>,
    }
}

export class Wallet extends jspb.Message { 
    getId(): string;
    setId(value: string): Wallet;
    getName(): string;
    setName(value: string): Wallet;

    hasConfig(): boolean;
    clearConfig(): void;
    getConfig(): WalletConfig | undefined;
    setConfig(value?: WalletConfig): Wallet;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Wallet.AsObject;
    static toObject(includeInstance: boolean, msg: Wallet): Wallet.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Wallet, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Wallet;
    static deserializeBinaryFromReader(message: Wallet, reader: jspb.BinaryReader): Wallet;
}

export namespace Wallet {
    export type AsObject = {
        id: string,
        name: string,
        config?: WalletConfig.AsObject,
    }
}

export class WalletConfig extends jspb.Message { 
    getSettleIncomeAfterNConfs(): number;
    setSettleIncomeAfterNConfs(value: number): WalletConfig;
    getSettleChangeAfterNConfs(): number;
    setSettleChangeAfterNConfs(value: number): WalletConfig;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WalletConfig.AsObject;
    static toObject(includeInstance: boolean, msg: WalletConfig): WalletConfig.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WalletConfig, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WalletConfig;
    static deserializeBinaryFromReader(message: WalletConfig, reader: jspb.BinaryReader): WalletConfig;
}

export namespace WalletConfig {
    export type AsObject = {
        settleIncomeAfterNConfs: number,
        settleChangeAfterNConfs: number,
    }
}

export class NewAddressRequest extends jspb.Message { 
    getWalletName(): string;
    setWalletName(value: string): NewAddressRequest;

    hasExternalId(): boolean;
    clearExternalId(): void;
    getExternalId(): string | undefined;
    setExternalId(value: string): NewAddressRequest;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): google_protobuf_struct_pb.Struct | undefined;
    setMetadata(value?: google_protobuf_struct_pb.Struct): NewAddressRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NewAddressRequest.AsObject;
    static toObject(includeInstance: boolean, msg: NewAddressRequest): NewAddressRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NewAddressRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NewAddressRequest;
    static deserializeBinaryFromReader(message: NewAddressRequest, reader: jspb.BinaryReader): NewAddressRequest;
}

export namespace NewAddressRequest {
    export type AsObject = {
        walletName: string,
        externalId?: string,
        metadata?: google_protobuf_struct_pb.Struct.AsObject,
    }
}

export class NewAddressResponse extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): NewAddressResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NewAddressResponse.AsObject;
    static toObject(includeInstance: boolean, msg: NewAddressResponse): NewAddressResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NewAddressResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NewAddressResponse;
    static deserializeBinaryFromReader(message: NewAddressResponse, reader: jspb.BinaryReader): NewAddressResponse;
}

export namespace NewAddressResponse {
    export type AsObject = {
        address: string,
    }
}

export class UpdateAddressRequest extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): UpdateAddressRequest;

    hasNewExternalId(): boolean;
    clearNewExternalId(): void;
    getNewExternalId(): string | undefined;
    setNewExternalId(value: string): UpdateAddressRequest;

    hasNewMetadata(): boolean;
    clearNewMetadata(): void;
    getNewMetadata(): google_protobuf_struct_pb.Struct | undefined;
    setNewMetadata(value?: google_protobuf_struct_pb.Struct): UpdateAddressRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateAddressRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateAddressRequest): UpdateAddressRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateAddressRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateAddressRequest;
    static deserializeBinaryFromReader(message: UpdateAddressRequest, reader: jspb.BinaryReader): UpdateAddressRequest;
}

export namespace UpdateAddressRequest {
    export type AsObject = {
        address: string,
        newExternalId?: string,
        newMetadata?: google_protobuf_struct_pb.Struct.AsObject,
    }
}

export class UpdateAddressResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateAddressResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateAddressResponse): UpdateAddressResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateAddressResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateAddressResponse;
    static deserializeBinaryFromReader(message: UpdateAddressResponse, reader: jspb.BinaryReader): UpdateAddressResponse;
}

export namespace UpdateAddressResponse {
    export type AsObject = {
    }
}

export class ListAddressesRequest extends jspb.Message { 
    getWalletName(): string;
    setWalletName(value: string): ListAddressesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListAddressesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListAddressesRequest): ListAddressesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListAddressesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListAddressesRequest;
    static deserializeBinaryFromReader(message: ListAddressesRequest, reader: jspb.BinaryReader): ListAddressesRequest;
}

export namespace ListAddressesRequest {
    export type AsObject = {
        walletName: string,
    }
}

export class ListAddressesResponse extends jspb.Message { 
    getWalletId(): string;
    setWalletId(value: string): ListAddressesResponse;
    clearAddressesList(): void;
    getAddressesList(): Array<WalletAddress>;
    setAddressesList(value: Array<WalletAddress>): ListAddressesResponse;
    addAddresses(value?: WalletAddress, index?: number): WalletAddress;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListAddressesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListAddressesResponse): ListAddressesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListAddressesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListAddressesResponse;
    static deserializeBinaryFromReader(message: ListAddressesResponse, reader: jspb.BinaryReader): ListAddressesResponse;
}

export namespace ListAddressesResponse {
    export type AsObject = {
        walletId: string,
        addressesList: Array<WalletAddress.AsObject>,
    }
}

export class WalletAddress extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): WalletAddress;
    getExternalId(): string;
    setExternalId(value: string): WalletAddress;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): google_protobuf_struct_pb.Struct | undefined;
    setMetadata(value?: google_protobuf_struct_pb.Struct): WalletAddress;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WalletAddress.AsObject;
    static toObject(includeInstance: boolean, msg: WalletAddress): WalletAddress.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WalletAddress, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WalletAddress;
    static deserializeBinaryFromReader(message: WalletAddress, reader: jspb.BinaryReader): WalletAddress;
}

export namespace WalletAddress {
    export type AsObject = {
        address: string,
        externalId: string,
        metadata?: google_protobuf_struct_pb.Struct.AsObject,
    }
}

export class ListUtxosRequest extends jspb.Message { 
    getWalletName(): string;
    setWalletName(value: string): ListUtxosRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListUtxosRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListUtxosRequest): ListUtxosRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListUtxosRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListUtxosRequest;
    static deserializeBinaryFromReader(message: ListUtxosRequest, reader: jspb.BinaryReader): ListUtxosRequest;
}

export namespace ListUtxosRequest {
    export type AsObject = {
        walletName: string,
    }
}

export class Utxo extends jspb.Message { 
    getOutpoint(): string;
    setOutpoint(value: string): Utxo;
    getAddressIdx(): number;
    setAddressIdx(value: number): Utxo;
    getValue(): number;
    setValue(value: number): Utxo;

    hasAddress(): boolean;
    clearAddress(): void;
    getAddress(): string | undefined;
    setAddress(value: string): Utxo;
    getChangeOutput(): boolean;
    setChangeOutput(value: boolean): Utxo;

    hasBlockHeight(): boolean;
    clearBlockHeight(): void;
    getBlockHeight(): number | undefined;
    setBlockHeight(value: number): Utxo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Utxo.AsObject;
    static toObject(includeInstance: boolean, msg: Utxo): Utxo.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Utxo, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Utxo;
    static deserializeBinaryFromReader(message: Utxo, reader: jspb.BinaryReader): Utxo;
}

export namespace Utxo {
    export type AsObject = {
        outpoint: string,
        addressIdx: number,
        value: number,
        address?: string,
        changeOutput: boolean,
        blockHeight?: number,
    }
}

export class KeychainUtxos extends jspb.Message { 
    getKeychainId(): string;
    setKeychainId(value: string): KeychainUtxos;
    clearUtxosList(): void;
    getUtxosList(): Array<Utxo>;
    setUtxosList(value: Array<Utxo>): KeychainUtxos;
    addUtxos(value?: Utxo, index?: number): Utxo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeychainUtxos.AsObject;
    static toObject(includeInstance: boolean, msg: KeychainUtxos): KeychainUtxos.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeychainUtxos, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeychainUtxos;
    static deserializeBinaryFromReader(message: KeychainUtxos, reader: jspb.BinaryReader): KeychainUtxos;
}

export namespace KeychainUtxos {
    export type AsObject = {
        keychainId: string,
        utxosList: Array<Utxo.AsObject>,
    }
}

export class ListUtxosResponse extends jspb.Message { 
    getWalletId(): string;
    setWalletId(value: string): ListUtxosResponse;
    clearKeychainsList(): void;
    getKeychainsList(): Array<KeychainUtxos>;
    setKeychainsList(value: Array<KeychainUtxos>): ListUtxosResponse;
    addKeychains(value?: KeychainUtxos, index?: number): KeychainUtxos;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListUtxosResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListUtxosResponse): ListUtxosResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListUtxosResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListUtxosResponse;
    static deserializeBinaryFromReader(message: ListUtxosResponse, reader: jspb.BinaryReader): ListUtxosResponse;
}

export namespace ListUtxosResponse {
    export type AsObject = {
        walletId: string,
        keychainsList: Array<KeychainUtxos.AsObject>,
    }
}

export class GetWalletBalanceSummaryRequest extends jspb.Message { 
    getWalletName(): string;
    setWalletName(value: string): GetWalletBalanceSummaryRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetWalletBalanceSummaryRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetWalletBalanceSummaryRequest): GetWalletBalanceSummaryRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetWalletBalanceSummaryRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetWalletBalanceSummaryRequest;
    static deserializeBinaryFromReader(message: GetWalletBalanceSummaryRequest, reader: jspb.BinaryReader): GetWalletBalanceSummaryRequest;
}

export namespace GetWalletBalanceSummaryRequest {
    export type AsObject = {
        walletName: string,
    }
}

export class GetWalletBalanceSummaryResponse extends jspb.Message { 
    getEffectivePendingIncome(): number;
    setEffectivePendingIncome(value: number): GetWalletBalanceSummaryResponse;
    getEffectiveSettled(): number;
    setEffectiveSettled(value: number): GetWalletBalanceSummaryResponse;
    getEffectivePendingOutgoing(): number;
    setEffectivePendingOutgoing(value: number): GetWalletBalanceSummaryResponse;
    getEffectiveEncumberedOutgoing(): number;
    setEffectiveEncumberedOutgoing(value: number): GetWalletBalanceSummaryResponse;
    getUtxoEncumberedIncoming(): number;
    setUtxoEncumberedIncoming(value: number): GetWalletBalanceSummaryResponse;
    getUtxoPendingIncoming(): number;
    setUtxoPendingIncoming(value: number): GetWalletBalanceSummaryResponse;
    getUtxoSettled(): number;
    setUtxoSettled(value: number): GetWalletBalanceSummaryResponse;
    getUtxoPendingOutgoing(): number;
    setUtxoPendingOutgoing(value: number): GetWalletBalanceSummaryResponse;
    getFeesPending(): number;
    setFeesPending(value: number): GetWalletBalanceSummaryResponse;
    getFeesEncumbered(): number;
    setFeesEncumbered(value: number): GetWalletBalanceSummaryResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetWalletBalanceSummaryResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetWalletBalanceSummaryResponse): GetWalletBalanceSummaryResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetWalletBalanceSummaryResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetWalletBalanceSummaryResponse;
    static deserializeBinaryFromReader(message: GetWalletBalanceSummaryResponse, reader: jspb.BinaryReader): GetWalletBalanceSummaryResponse;
}

export namespace GetWalletBalanceSummaryResponse {
    export type AsObject = {
        effectivePendingIncome: number,
        effectiveSettled: number,
        effectivePendingOutgoing: number,
        effectiveEncumberedOutgoing: number,
        utxoEncumberedIncoming: number,
        utxoPendingIncoming: number,
        utxoSettled: number,
        utxoPendingOutgoing: number,
        feesPending: number,
        feesEncumbered: number,
    }
}

export class GetAccountBalanceSummaryRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetAccountBalanceSummaryRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetAccountBalanceSummaryRequest): GetAccountBalanceSummaryRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetAccountBalanceSummaryRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetAccountBalanceSummaryRequest;
    static deserializeBinaryFromReader(message: GetAccountBalanceSummaryRequest, reader: jspb.BinaryReader): GetAccountBalanceSummaryRequest;
}

export namespace GetAccountBalanceSummaryRequest {
    export type AsObject = {
    }
}

export class GetAccountBalanceSummaryResponse extends jspb.Message { 
    getEffectivePendingIncome(): number;
    setEffectivePendingIncome(value: number): GetAccountBalanceSummaryResponse;
    getEffectiveSettled(): number;
    setEffectiveSettled(value: number): GetAccountBalanceSummaryResponse;
    getEffectivePendingOutgoing(): number;
    setEffectivePendingOutgoing(value: number): GetAccountBalanceSummaryResponse;
    getEffectiveEncumberedOutgoing(): number;
    setEffectiveEncumberedOutgoing(value: number): GetAccountBalanceSummaryResponse;
    getUtxoEncumberedIncoming(): number;
    setUtxoEncumberedIncoming(value: number): GetAccountBalanceSummaryResponse;
    getUtxoPendingIncoming(): number;
    setUtxoPendingIncoming(value: number): GetAccountBalanceSummaryResponse;
    getUtxoSettled(): number;
    setUtxoSettled(value: number): GetAccountBalanceSummaryResponse;
    getUtxoPendingOutgoing(): number;
    setUtxoPendingOutgoing(value: number): GetAccountBalanceSummaryResponse;
    getFeesPending(): number;
    setFeesPending(value: number): GetAccountBalanceSummaryResponse;
    getFeesEncumbered(): number;
    setFeesEncumbered(value: number): GetAccountBalanceSummaryResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetAccountBalanceSummaryResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetAccountBalanceSummaryResponse): GetAccountBalanceSummaryResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetAccountBalanceSummaryResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetAccountBalanceSummaryResponse;
    static deserializeBinaryFromReader(message: GetAccountBalanceSummaryResponse, reader: jspb.BinaryReader): GetAccountBalanceSummaryResponse;
}

export namespace GetAccountBalanceSummaryResponse {
    export type AsObject = {
        effectivePendingIncome: number,
        effectiveSettled: number,
        effectivePendingOutgoing: number,
        effectiveEncumberedOutgoing: number,
        utxoEncumberedIncoming: number,
        utxoPendingIncoming: number,
        utxoSettled: number,
        utxoPendingOutgoing: number,
        feesPending: number,
        feesEncumbered: number,
    }
}

export class CreatePayoutQueueRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreatePayoutQueueRequest;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): CreatePayoutQueueRequest;

    hasConfig(): boolean;
    clearConfig(): void;
    getConfig(): PayoutQueueConfig | undefined;
    setConfig(value?: PayoutQueueConfig): CreatePayoutQueueRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreatePayoutQueueRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreatePayoutQueueRequest): CreatePayoutQueueRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreatePayoutQueueRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreatePayoutQueueRequest;
    static deserializeBinaryFromReader(message: CreatePayoutQueueRequest, reader: jspb.BinaryReader): CreatePayoutQueueRequest;
}

export namespace CreatePayoutQueueRequest {
    export type AsObject = {
        name: string,
        description?: string,
        config?: PayoutQueueConfig.AsObject,
    }
}

export class PayoutQueueConfig extends jspb.Message { 
    getTxPriority(): TxPriority;
    setTxPriority(value: TxPriority): PayoutQueueConfig;
    getConsolidateDeprecatedKeychains(): boolean;
    setConsolidateDeprecatedKeychains(value: boolean): PayoutQueueConfig;

    hasIntervalSecs(): boolean;
    clearIntervalSecs(): void;
    getIntervalSecs(): number;
    setIntervalSecs(value: number): PayoutQueueConfig;

    getTriggerCase(): PayoutQueueConfig.TriggerCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PayoutQueueConfig.AsObject;
    static toObject(includeInstance: boolean, msg: PayoutQueueConfig): PayoutQueueConfig.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PayoutQueueConfig, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PayoutQueueConfig;
    static deserializeBinaryFromReader(message: PayoutQueueConfig, reader: jspb.BinaryReader): PayoutQueueConfig;
}

export namespace PayoutQueueConfig {
    export type AsObject = {
        txPriority: TxPriority,
        consolidateDeprecatedKeychains: boolean,
        intervalSecs: number,
    }

    export enum TriggerCase {
        TRIGGER_NOT_SET = 0,
        INTERVAL_SECS = 5,
    }

}

export class CreatePayoutQueueResponse extends jspb.Message { 
    getId(): string;
    setId(value: string): CreatePayoutQueueResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreatePayoutQueueResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreatePayoutQueueResponse): CreatePayoutQueueResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreatePayoutQueueResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreatePayoutQueueResponse;
    static deserializeBinaryFromReader(message: CreatePayoutQueueResponse, reader: jspb.BinaryReader): CreatePayoutQueueResponse;
}

export namespace CreatePayoutQueueResponse {
    export type AsObject = {
        id: string,
    }
}

export class PayoutQueue extends jspb.Message { 
    getId(): string;
    setId(value: string): PayoutQueue;
    getName(): string;
    setName(value: string): PayoutQueue;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): PayoutQueue;

    hasConfig(): boolean;
    clearConfig(): void;
    getConfig(): PayoutQueueConfig | undefined;
    setConfig(value?: PayoutQueueConfig): PayoutQueue;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PayoutQueue.AsObject;
    static toObject(includeInstance: boolean, msg: PayoutQueue): PayoutQueue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PayoutQueue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PayoutQueue;
    static deserializeBinaryFromReader(message: PayoutQueue, reader: jspb.BinaryReader): PayoutQueue;
}

export namespace PayoutQueue {
    export type AsObject = {
        id: string,
        name: string,
        description?: string,
        config?: PayoutQueueConfig.AsObject,
    }
}

export class ListPayoutQueuesResponse extends jspb.Message { 
    clearPayoutQueuesList(): void;
    getPayoutQueuesList(): Array<PayoutQueue>;
    setPayoutQueuesList(value: Array<PayoutQueue>): ListPayoutQueuesResponse;
    addPayoutQueues(value?: PayoutQueue, index?: number): PayoutQueue;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListPayoutQueuesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListPayoutQueuesResponse): ListPayoutQueuesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListPayoutQueuesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListPayoutQueuesResponse;
    static deserializeBinaryFromReader(message: ListPayoutQueuesResponse, reader: jspb.BinaryReader): ListPayoutQueuesResponse;
}

export namespace ListPayoutQueuesResponse {
    export type AsObject = {
        payoutQueuesList: Array<PayoutQueue.AsObject>,
    }
}

export class ListPayoutQueuesRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListPayoutQueuesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListPayoutQueuesRequest): ListPayoutQueuesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListPayoutQueuesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListPayoutQueuesRequest;
    static deserializeBinaryFromReader(message: ListPayoutQueuesRequest, reader: jspb.BinaryReader): ListPayoutQueuesRequest;
}

export namespace ListPayoutQueuesRequest {
    export type AsObject = {
    }
}

export class UpdatePayoutQueueRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): UpdatePayoutQueueRequest;

    hasNewDescription(): boolean;
    clearNewDescription(): void;
    getNewDescription(): string | undefined;
    setNewDescription(value: string): UpdatePayoutQueueRequest;

    hasNewConfig(): boolean;
    clearNewConfig(): void;
    getNewConfig(): PayoutQueueConfig | undefined;
    setNewConfig(value?: PayoutQueueConfig): UpdatePayoutQueueRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdatePayoutQueueRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdatePayoutQueueRequest): UpdatePayoutQueueRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdatePayoutQueueRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdatePayoutQueueRequest;
    static deserializeBinaryFromReader(message: UpdatePayoutQueueRequest, reader: jspb.BinaryReader): UpdatePayoutQueueRequest;
}

export namespace UpdatePayoutQueueRequest {
    export type AsObject = {
        id: string,
        newDescription?: string,
        newConfig?: PayoutQueueConfig.AsObject,
    }
}

export class UpdatePayoutQueueResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdatePayoutQueueResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdatePayoutQueueResponse): UpdatePayoutQueueResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdatePayoutQueueResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdatePayoutQueueResponse;
    static deserializeBinaryFromReader(message: UpdatePayoutQueueResponse, reader: jspb.BinaryReader): UpdatePayoutQueueResponse;
}

export namespace UpdatePayoutQueueResponse {
    export type AsObject = {
    }
}

export class EstimatePayoutFeeRequest extends jspb.Message { 
    getWalletName(): string;
    setWalletName(value: string): EstimatePayoutFeeRequest;
    getPayoutQueueName(): string;
    setPayoutQueueName(value: string): EstimatePayoutFeeRequest;

    hasOnchainAddress(): boolean;
    clearOnchainAddress(): void;
    getOnchainAddress(): string;
    setOnchainAddress(value: string): EstimatePayoutFeeRequest;
    getSatoshis(): number;
    setSatoshis(value: number): EstimatePayoutFeeRequest;

    getDestinationCase(): EstimatePayoutFeeRequest.DestinationCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EstimatePayoutFeeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: EstimatePayoutFeeRequest): EstimatePayoutFeeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EstimatePayoutFeeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EstimatePayoutFeeRequest;
    static deserializeBinaryFromReader(message: EstimatePayoutFeeRequest, reader: jspb.BinaryReader): EstimatePayoutFeeRequest;
}

export namespace EstimatePayoutFeeRequest {
    export type AsObject = {
        walletName: string,
        payoutQueueName: string,
        onchainAddress: string,
        satoshis: number,
    }

    export enum DestinationCase {
        DESTINATION_NOT_SET = 0,
        ONCHAIN_ADDRESS = 3,
    }

}

export class EstimatePayoutFeeResponse extends jspb.Message { 
    getSatoshis(): number;
    setSatoshis(value: number): EstimatePayoutFeeResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EstimatePayoutFeeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: EstimatePayoutFeeResponse): EstimatePayoutFeeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EstimatePayoutFeeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EstimatePayoutFeeResponse;
    static deserializeBinaryFromReader(message: EstimatePayoutFeeResponse, reader: jspb.BinaryReader): EstimatePayoutFeeResponse;
}

export namespace EstimatePayoutFeeResponse {
    export type AsObject = {
        satoshis: number,
    }
}

export class SubmitPayoutRequest extends jspb.Message { 
    getWalletName(): string;
    setWalletName(value: string): SubmitPayoutRequest;
    getPayoutQueueName(): string;
    setPayoutQueueName(value: string): SubmitPayoutRequest;

    hasOnchainAddress(): boolean;
    clearOnchainAddress(): void;
    getOnchainAddress(): string;
    setOnchainAddress(value: string): SubmitPayoutRequest;
    getSatoshis(): number;
    setSatoshis(value: number): SubmitPayoutRequest;

    hasExternalId(): boolean;
    clearExternalId(): void;
    getExternalId(): string | undefined;
    setExternalId(value: string): SubmitPayoutRequest;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): google_protobuf_struct_pb.Struct | undefined;
    setMetadata(value?: google_protobuf_struct_pb.Struct): SubmitPayoutRequest;

    getDestinationCase(): SubmitPayoutRequest.DestinationCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubmitPayoutRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubmitPayoutRequest): SubmitPayoutRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubmitPayoutRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubmitPayoutRequest;
    static deserializeBinaryFromReader(message: SubmitPayoutRequest, reader: jspb.BinaryReader): SubmitPayoutRequest;
}

export namespace SubmitPayoutRequest {
    export type AsObject = {
        walletName: string,
        payoutQueueName: string,
        onchainAddress: string,
        satoshis: number,
        externalId?: string,
        metadata?: google_protobuf_struct_pb.Struct.AsObject,
    }

    export enum DestinationCase {
        DESTINATION_NOT_SET = 0,
        ONCHAIN_ADDRESS = 3,
    }

}

export class SubmitPayoutResponse extends jspb.Message { 
    getId(): string;
    setId(value: string): SubmitPayoutResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubmitPayoutResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SubmitPayoutResponse): SubmitPayoutResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubmitPayoutResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubmitPayoutResponse;
    static deserializeBinaryFromReader(message: SubmitPayoutResponse, reader: jspb.BinaryReader): SubmitPayoutResponse;
}

export namespace SubmitPayoutResponse {
    export type AsObject = {
        id: string,
    }
}

export class ListPayoutsRequest extends jspb.Message { 
    getWalletName(): string;
    setWalletName(value: string): ListPayoutsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListPayoutsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListPayoutsRequest): ListPayoutsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListPayoutsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListPayoutsRequest;
    static deserializeBinaryFromReader(message: ListPayoutsRequest, reader: jspb.BinaryReader): ListPayoutsRequest;
}

export namespace ListPayoutsRequest {
    export type AsObject = {
        walletName: string,
    }
}

export class Payout extends jspb.Message { 
    getId(): string;
    setId(value: string): Payout;
    getWalletId(): string;
    setWalletId(value: string): Payout;
    getPayoutQueueId(): string;
    setPayoutQueueId(value: string): Payout;

    hasBatchId(): boolean;
    clearBatchId(): void;
    getBatchId(): string | undefined;
    setBatchId(value: string): Payout;
    getSatoshis(): number;
    setSatoshis(value: number): Payout;

    hasOnchainAddress(): boolean;
    clearOnchainAddress(): void;
    getOnchainAddress(): string;
    setOnchainAddress(value: string): Payout;
    getExternalId(): string;
    setExternalId(value: string): Payout;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): google_protobuf_struct_pb.Struct | undefined;
    setMetadata(value?: google_protobuf_struct_pb.Struct): Payout;

    getDestinationCase(): Payout.DestinationCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Payout.AsObject;
    static toObject(includeInstance: boolean, msg: Payout): Payout.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Payout, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Payout;
    static deserializeBinaryFromReader(message: Payout, reader: jspb.BinaryReader): Payout;
}

export namespace Payout {
    export type AsObject = {
        id: string,
        walletId: string,
        payoutQueueId: string,
        batchId?: string,
        satoshis: number,
        onchainAddress: string,
        externalId: string,
        metadata?: google_protobuf_struct_pb.Struct.AsObject,
    }

    export enum DestinationCase {
        DESTINATION_NOT_SET = 0,
        ONCHAIN_ADDRESS = 6,
    }

}

export class ListPayoutsResponse extends jspb.Message { 
    clearPayoutsList(): void;
    getPayoutsList(): Array<Payout>;
    setPayoutsList(value: Array<Payout>): ListPayoutsResponse;
    addPayouts(value?: Payout, index?: number): Payout;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListPayoutsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListPayoutsResponse): ListPayoutsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListPayoutsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListPayoutsResponse;
    static deserializeBinaryFromReader(message: ListPayoutsResponse, reader: jspb.BinaryReader): ListPayoutsResponse;
}

export namespace ListPayoutsResponse {
    export type AsObject = {
        payoutsList: Array<Payout.AsObject>,
    }
}

export class ListSigningSessionsRequest extends jspb.Message { 
    getBatchId(): string;
    setBatchId(value: string): ListSigningSessionsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSigningSessionsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListSigningSessionsRequest): ListSigningSessionsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListSigningSessionsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListSigningSessionsRequest;
    static deserializeBinaryFromReader(message: ListSigningSessionsRequest, reader: jspb.BinaryReader): ListSigningSessionsRequest;
}

export namespace ListSigningSessionsRequest {
    export type AsObject = {
        batchId: string,
    }
}

export class SigningSession extends jspb.Message { 
    getId(): string;
    setId(value: string): SigningSession;
    getBatchId(): string;
    setBatchId(value: string): SigningSession;
    getXpubId(): string;
    setXpubId(value: string): SigningSession;
    getState(): string;
    setState(value: string): SigningSession;

    hasFailureReason(): boolean;
    clearFailureReason(): void;
    getFailureReason(): string | undefined;
    setFailureReason(value: string): SigningSession;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SigningSession.AsObject;
    static toObject(includeInstance: boolean, msg: SigningSession): SigningSession.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SigningSession, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SigningSession;
    static deserializeBinaryFromReader(message: SigningSession, reader: jspb.BinaryReader): SigningSession;
}

export namespace SigningSession {
    export type AsObject = {
        id: string,
        batchId: string,
        xpubId: string,
        state: string,
        failureReason?: string,
    }
}

export class ListSigningSessionsResponse extends jspb.Message { 
    clearSessionsList(): void;
    getSessionsList(): Array<SigningSession>;
    setSessionsList(value: Array<SigningSession>): ListSigningSessionsResponse;
    addSessions(value?: SigningSession, index?: number): SigningSession;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSigningSessionsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListSigningSessionsResponse): ListSigningSessionsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListSigningSessionsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListSigningSessionsResponse;
    static deserializeBinaryFromReader(message: ListSigningSessionsResponse, reader: jspb.BinaryReader): ListSigningSessionsResponse;
}

export namespace ListSigningSessionsResponse {
    export type AsObject = {
        sessionsList: Array<SigningSession.AsObject>,
    }
}

export class ListXpubsRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListXpubsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListXpubsRequest): ListXpubsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListXpubsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListXpubsRequest;
    static deserializeBinaryFromReader(message: ListXpubsRequest, reader: jspb.BinaryReader): ListXpubsRequest;
}

export namespace ListXpubsRequest {
    export type AsObject = {
    }
}

export class ListXpubsResponse extends jspb.Message { 
    clearXpubsList(): void;
    getXpubsList(): Array<Xpub>;
    setXpubsList(value: Array<Xpub>): ListXpubsResponse;
    addXpubs(value?: Xpub, index?: number): Xpub;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListXpubsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListXpubsResponse): ListXpubsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListXpubsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListXpubsResponse;
    static deserializeBinaryFromReader(message: ListXpubsResponse, reader: jspb.BinaryReader): ListXpubsResponse;
}

export namespace ListXpubsResponse {
    export type AsObject = {
        xpubsList: Array<Xpub.AsObject>,
    }
}

export class Xpub extends jspb.Message { 
    getId(): string;
    setId(value: string): Xpub;
    getName(): string;
    setName(value: string): Xpub;
    getXpub(): string;
    setXpub(value: string): Xpub;

    hasDerivationPath(): boolean;
    clearDerivationPath(): void;
    getDerivationPath(): string | undefined;
    setDerivationPath(value: string): Xpub;
    getHasSignerConfig(): boolean;
    setHasSignerConfig(value: boolean): Xpub;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Xpub.AsObject;
    static toObject(includeInstance: boolean, msg: Xpub): Xpub.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Xpub, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Xpub;
    static deserializeBinaryFromReader(message: Xpub, reader: jspb.BinaryReader): Xpub;
}

export namespace Xpub {
    export type AsObject = {
        id: string,
        name: string,
        xpub: string,
        derivationPath?: string,
        hasSignerConfig: boolean,
    }
}

export class SubscribeAllRequest extends jspb.Message { 

    hasAfterSequence(): boolean;
    clearAfterSequence(): void;
    getAfterSequence(): number | undefined;
    setAfterSequence(value: number): SubscribeAllRequest;

    hasAugment(): boolean;
    clearAugment(): void;
    getAugment(): boolean | undefined;
    setAugment(value: boolean): SubscribeAllRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeAllRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeAllRequest): SubscribeAllRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeAllRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeAllRequest;
    static deserializeBinaryFromReader(message: SubscribeAllRequest, reader: jspb.BinaryReader): SubscribeAllRequest;
}

export namespace SubscribeAllRequest {
    export type AsObject = {
        afterSequence?: number,
        augment?: boolean,
    }
}

export class BriaEvent extends jspb.Message { 
    getSequence(): number;
    setSequence(value: number): BriaEvent;
    getRecordedAt(): number;
    setRecordedAt(value: number): BriaEvent;

    hasAugmentation(): boolean;
    clearAugmentation(): void;
    getAugmentation(): EventAugmentation | undefined;
    setAugmentation(value?: EventAugmentation): BriaEvent;

    hasUtxoDetected(): boolean;
    clearUtxoDetected(): void;
    getUtxoDetected(): UtxoDetected | undefined;
    setUtxoDetected(value?: UtxoDetected): BriaEvent;

    hasUtxoSettled(): boolean;
    clearUtxoSettled(): void;
    getUtxoSettled(): UtxoSettled | undefined;
    setUtxoSettled(value?: UtxoSettled): BriaEvent;

    hasPayoutSubmitted(): boolean;
    clearPayoutSubmitted(): void;
    getPayoutSubmitted(): PayoutSubmitted | undefined;
    setPayoutSubmitted(value?: PayoutSubmitted): BriaEvent;

    hasPayoutCommitted(): boolean;
    clearPayoutCommitted(): void;
    getPayoutCommitted(): PayoutCommitted | undefined;
    setPayoutCommitted(value?: PayoutCommitted): BriaEvent;

    hasPayoutBroadcast(): boolean;
    clearPayoutBroadcast(): void;
    getPayoutBroadcast(): PayoutBroadcast | undefined;
    setPayoutBroadcast(value?: PayoutBroadcast): BriaEvent;

    hasPayoutSettled(): boolean;
    clearPayoutSettled(): void;
    getPayoutSettled(): PayoutSettled | undefined;
    setPayoutSettled(value?: PayoutSettled): BriaEvent;

    getPayloadCase(): BriaEvent.PayloadCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BriaEvent.AsObject;
    static toObject(includeInstance: boolean, msg: BriaEvent): BriaEvent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BriaEvent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BriaEvent;
    static deserializeBinaryFromReader(message: BriaEvent, reader: jspb.BinaryReader): BriaEvent;
}

export namespace BriaEvent {
    export type AsObject = {
        sequence: number,
        recordedAt: number,
        augmentation?: EventAugmentation.AsObject,
        utxoDetected?: UtxoDetected.AsObject,
        utxoSettled?: UtxoSettled.AsObject,
        payoutSubmitted?: PayoutSubmitted.AsObject,
        payoutCommitted?: PayoutCommitted.AsObject,
        payoutBroadcast?: PayoutBroadcast.AsObject,
        payoutSettled?: PayoutSettled.AsObject,
    }

    export enum PayloadCase {
        PAYLOAD_NOT_SET = 0,
        UTXO_DETECTED = 4,
        UTXO_SETTLED = 5,
        PAYOUT_SUBMITTED = 6,
        PAYOUT_COMMITTED = 7,
        PAYOUT_BROADCAST = 8,
        PAYOUT_SETTLED = 9,
    }

}

export class EventAugmentation extends jspb.Message { 

    hasAddressInfo(): boolean;
    clearAddressInfo(): void;
    getAddressInfo(): WalletAddress | undefined;
    setAddressInfo(value?: WalletAddress): EventAugmentation;

    hasPayoutInfo(): boolean;
    clearPayoutInfo(): void;
    getPayoutInfo(): Payout | undefined;
    setPayoutInfo(value?: Payout): EventAugmentation;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EventAugmentation.AsObject;
    static toObject(includeInstance: boolean, msg: EventAugmentation): EventAugmentation.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EventAugmentation, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EventAugmentation;
    static deserializeBinaryFromReader(message: EventAugmentation, reader: jspb.BinaryReader): EventAugmentation;
}

export namespace EventAugmentation {
    export type AsObject = {
        addressInfo?: WalletAddress.AsObject,
        payoutInfo?: Payout.AsObject,
    }
}

export class UtxoDetected extends jspb.Message { 
    getWalletId(): string;
    setWalletId(value: string): UtxoDetected;
    getTxId(): string;
    setTxId(value: string): UtxoDetected;
    getVout(): number;
    setVout(value: number): UtxoDetected;
    getSatoshis(): number;
    setSatoshis(value: number): UtxoDetected;
    getAddress(): string;
    setAddress(value: string): UtxoDetected;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UtxoDetected.AsObject;
    static toObject(includeInstance: boolean, msg: UtxoDetected): UtxoDetected.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UtxoDetected, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UtxoDetected;
    static deserializeBinaryFromReader(message: UtxoDetected, reader: jspb.BinaryReader): UtxoDetected;
}

export namespace UtxoDetected {
    export type AsObject = {
        walletId: string,
        txId: string,
        vout: number,
        satoshis: number,
        address: string,
    }
}

export class UtxoSettled extends jspb.Message { 
    getWalletId(): string;
    setWalletId(value: string): UtxoSettled;
    getTxId(): string;
    setTxId(value: string): UtxoSettled;
    getVout(): number;
    setVout(value: number): UtxoSettled;
    getSatoshis(): number;
    setSatoshis(value: number): UtxoSettled;
    getAddress(): string;
    setAddress(value: string): UtxoSettled;
    getBlockHeight(): number;
    setBlockHeight(value: number): UtxoSettled;
    getBlockTime(): number;
    setBlockTime(value: number): UtxoSettled;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UtxoSettled.AsObject;
    static toObject(includeInstance: boolean, msg: UtxoSettled): UtxoSettled.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UtxoSettled, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UtxoSettled;
    static deserializeBinaryFromReader(message: UtxoSettled, reader: jspb.BinaryReader): UtxoSettled;
}

export namespace UtxoSettled {
    export type AsObject = {
        walletId: string,
        txId: string,
        vout: number,
        satoshis: number,
        address: string,
        blockHeight: number,
        blockTime: number,
    }
}

export class PayoutSubmitted extends jspb.Message { 
    getId(): string;
    setId(value: string): PayoutSubmitted;
    getWalletId(): string;
    setWalletId(value: string): PayoutSubmitted;
    getPayoutQueueId(): string;
    setPayoutQueueId(value: string): PayoutSubmitted;
    getSatoshis(): number;
    setSatoshis(value: number): PayoutSubmitted;

    hasOnchainAddress(): boolean;
    clearOnchainAddress(): void;
    getOnchainAddress(): string;
    setOnchainAddress(value: string): PayoutSubmitted;

    getDestinationCase(): PayoutSubmitted.DestinationCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PayoutSubmitted.AsObject;
    static toObject(includeInstance: boolean, msg: PayoutSubmitted): PayoutSubmitted.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PayoutSubmitted, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PayoutSubmitted;
    static deserializeBinaryFromReader(message: PayoutSubmitted, reader: jspb.BinaryReader): PayoutSubmitted;
}

export namespace PayoutSubmitted {
    export type AsObject = {
        id: string,
        walletId: string,
        payoutQueueId: string,
        satoshis: number,
        onchainAddress: string,
    }

    export enum DestinationCase {
        DESTINATION_NOT_SET = 0,
        ONCHAIN_ADDRESS = 5,
    }

}

export class PayoutCommitted extends jspb.Message { 
    getId(): string;
    setId(value: string): PayoutCommitted;
    getTxId(): string;
    setTxId(value: string): PayoutCommitted;
    getWalletId(): string;
    setWalletId(value: string): PayoutCommitted;
    getPayoutQueueId(): string;
    setPayoutQueueId(value: string): PayoutCommitted;
    getSatoshis(): number;
    setSatoshis(value: number): PayoutCommitted;

    hasOnchainAddress(): boolean;
    clearOnchainAddress(): void;
    getOnchainAddress(): string;
    setOnchainAddress(value: string): PayoutCommitted;
    getProportionalFeeSats(): number;
    setProportionalFeeSats(value: number): PayoutCommitted;

    getDestinationCase(): PayoutCommitted.DestinationCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PayoutCommitted.AsObject;
    static toObject(includeInstance: boolean, msg: PayoutCommitted): PayoutCommitted.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PayoutCommitted, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PayoutCommitted;
    static deserializeBinaryFromReader(message: PayoutCommitted, reader: jspb.BinaryReader): PayoutCommitted;
}

export namespace PayoutCommitted {
    export type AsObject = {
        id: string,
        txId: string,
        walletId: string,
        payoutQueueId: string,
        satoshis: number,
        onchainAddress: string,
        proportionalFeeSats: number,
    }

    export enum DestinationCase {
        DESTINATION_NOT_SET = 0,
        ONCHAIN_ADDRESS = 6,
    }

}

export class PayoutBroadcast extends jspb.Message { 
    getId(): string;
    setId(value: string): PayoutBroadcast;
    getTxId(): string;
    setTxId(value: string): PayoutBroadcast;
    getWalletId(): string;
    setWalletId(value: string): PayoutBroadcast;
    getPayoutQueueId(): string;
    setPayoutQueueId(value: string): PayoutBroadcast;
    getSatoshis(): number;
    setSatoshis(value: number): PayoutBroadcast;

    hasOnchainAddress(): boolean;
    clearOnchainAddress(): void;
    getOnchainAddress(): string;
    setOnchainAddress(value: string): PayoutBroadcast;
    getProportionalFeeSats(): number;
    setProportionalFeeSats(value: number): PayoutBroadcast;

    getDestinationCase(): PayoutBroadcast.DestinationCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PayoutBroadcast.AsObject;
    static toObject(includeInstance: boolean, msg: PayoutBroadcast): PayoutBroadcast.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PayoutBroadcast, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PayoutBroadcast;
    static deserializeBinaryFromReader(message: PayoutBroadcast, reader: jspb.BinaryReader): PayoutBroadcast;
}

export namespace PayoutBroadcast {
    export type AsObject = {
        id: string,
        txId: string,
        walletId: string,
        payoutQueueId: string,
        satoshis: number,
        onchainAddress: string,
        proportionalFeeSats: number,
    }

    export enum DestinationCase {
        DESTINATION_NOT_SET = 0,
        ONCHAIN_ADDRESS = 6,
    }

}

export class PayoutSettled extends jspb.Message { 
    getId(): string;
    setId(value: string): PayoutSettled;
    getTxId(): string;
    setTxId(value: string): PayoutSettled;
    getWalletId(): string;
    setWalletId(value: string): PayoutSettled;
    getPayoutQueueId(): string;
    setPayoutQueueId(value: string): PayoutSettled;
    getSatoshis(): number;
    setSatoshis(value: number): PayoutSettled;

    hasOnchainAddress(): boolean;
    clearOnchainAddress(): void;
    getOnchainAddress(): string;
    setOnchainAddress(value: string): PayoutSettled;
    getProportionalFeeSats(): number;
    setProportionalFeeSats(value: number): PayoutSettled;

    getDestinationCase(): PayoutSettled.DestinationCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PayoutSettled.AsObject;
    static toObject(includeInstance: boolean, msg: PayoutSettled): PayoutSettled.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PayoutSettled, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PayoutSettled;
    static deserializeBinaryFromReader(message: PayoutSettled, reader: jspb.BinaryReader): PayoutSettled;
}

export namespace PayoutSettled {
    export type AsObject = {
        id: string,
        txId: string,
        walletId: string,
        payoutQueueId: string,
        satoshis: number,
        onchainAddress: string,
        proportionalFeeSats: number,
    }

    export enum DestinationCase {
        DESTINATION_NOT_SET = 0,
        ONCHAIN_ADDRESS = 6,
    }

}

export enum KeychainKind {
    INTERNAL = 0,
    EXTERNAL = 1,
}

export enum TxPriority {
    NEXT_BLOCK = 0,
    HALF_HOUR = 1,
    ONE_HOUR = 2,
}
