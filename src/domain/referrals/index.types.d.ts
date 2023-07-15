type ReferralLink = string & { readonly brand: unique symbol }

type ReferralRange =
  typeof import("./index").ReferralRange[keyof typeof import("./index").ReferralRange]

type ReferralRank = number & { readonly brand: unique symbol }

type ReferralId = string & { readonly brand: unique symbol }

type UserReferralStats = {
    userId: UserId
    range: ReferralRange
    referralCount: BigInt
    indirectReferralCount: BigInt
    referralRanking: ReferralRank
}

type Referral = {
    id: ReferralId
    referringUserId: UserId
    referredUserId: UserId
    date: Date
    referringTxId: LedgerTransactionId
}

type ReferralRanking = {
    userId: UserId
    referralCount: BigInt
    rank: BigInt
}


type IReferralInfoService = {
    getUserReferralStats: ({
        userId,
        referralRange,
    } : {
        userId: UserId
        referralRange: ReferralRange
    }) => Promise<UserReferralStats>

    getUserReferral: ({
        userId,
    }: {
        userId: UserId
    }) => Promise<Referral | null>

    markReferral: ({
        referringUserId,
        referredUserId,
        referringTxId,
    } : {
        referringUserId: UserId
        referredUserId: UserId
        // This couples a referral to the way in which a referral is marked
        referringTxId: LedgerTransactionId
    }) => Promise<void>

    getReferralRankings: ({
        referralRange,
        start,
        limit,
    }: {
        referralRange: ReferralRange
        start: ReferralRank
        limit: BigInt
    }) => Promise<ReferralRanking[]>
}

