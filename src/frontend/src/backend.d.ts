import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export type PoolId = string;
export interface HttpRequestResult {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export type CredentialStatus = {
    __kind__: "error";
    error: string;
} | {
    __kind__: "disconnected";
    disconnected: null;
} | {
    __kind__: "connected";
    connected: null;
};
export interface AllocationView {
    deviation: bigint;
    currentPercent: bigint;
    targetPercent: bigint;
    poolId: PoolId;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface CredentialView {
    id: string;
    status: CredentialStatus;
    createdAt: bigint;
    apiKey: string;
    exchange: string;
}
export interface Credential {
    id: string;
    status: CredentialStatus;
    createdAt: bigint;
    apiKey: string;
    apiSecret: string;
    exchange: string;
}
export interface AlertPreferences {
    impermanentLossRisk: boolean;
    liquidityWithdrawn: boolean;
    liquidityRemoved: boolean;
    emailDelivery: boolean;
}
export interface Pool {
    id: PoolId;
    apy: number;
    dex: string;
    tvl: number;
    name: string;
    volume24h: number;
    fees24h: number;
    compositeScore: number;
    priceVolatility: number;
}
export interface TrackedPool {
    addedAt: Timestamp;
    poolId: PoolId;
}
export interface RebalanceRecord {
    at: Timestamp;
    id: bigint;
    changes: Array<AllocationChange>;
}
export interface HttpHeader {
    value: string;
    name: string;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: HttpRequestResult;
}
export interface Notification {
    at: Timestamp;
    id: bigint;
    kind: NotificationType;
    read: boolean;
    poolId: PoolId;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface AllocationChange {
    fromPercent: bigint;
    toPercent: bigint;
    poolId: PoolId;
}
export interface Allocation {
    targetPercent: bigint;
    poolId: PoolId;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum NotificationType {
    impermanentLossRisk = "impermanentLossRisk",
    liquidityWithdrawn = "liquidityWithdrawn",
    liquidityRemoved = "liquidityRemoved"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCredential(cred: Credential): Promise<void>;
    addTrackedPool(poolId: PoolId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkConnection(id: string): Promise<CredentialStatus>;
    computeRebalance(current: Array<Allocation>, targets: Array<Allocation>): Promise<Array<AllocationChange>>;
    createNotification(kind: NotificationType, poolId: PoolId, email: string): Promise<void>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getCredential(id: string): Promise<CredentialView | null>;
    getPool(poolId: PoolId): Promise<Pool | null>;
    getPreferences(): Promise<AlertPreferences>;
    isCallerAdmin(): Promise<boolean>;
    listAllocations(): Promise<Array<AllocationView>>;
    listCredentials(): Promise<Array<CredentialView>>;
    listNotifications(): Promise<Array<Notification>>;
    listPools(): Promise<Array<Pool>>;
    listRebalanceHistory(): Promise<Array<RebalanceRecord>>;
    listTrackedPools(): Promise<Array<TrackedPool>>;
    markAllRead(): Promise<void>;
    markRead(id: bigint): Promise<void>;
    rebalance(): Promise<RebalanceRecord>;
    refreshPools(): Promise<void>;
    removeCredential(id: string): Promise<void>;
    schema(): Promise<string>;
    setTarget(targets: Array<Allocation>): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateCredential(cred: Credential): Promise<void>;
    updatePreferences(prefs: AlertPreferences): Promise<void>;
}
