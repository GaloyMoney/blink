type CheckTxForReferralProps = {
    maybeReferringTx?: string
}

type CheckTxForReferrralResult = {
    isReferingTx: true
    referral: Referral
} | {
    isReferral: false
}

export const checkTxForReferral = async (props: CheckTxForReferralProps): Promise<CheckTxForReferrralResult | ApplicationError> => {
    throw new Error("Not implemented")
}
