type GetUserReferralInfoProps = {
    referralRange: ReferralRange
    userId: string
}

export const getUserReferralStats = async (props: GetUserReferralInfoProps): Promise<UserReferralStats | ApplicationError> => {
    throw new Error("Not implemented")
}
