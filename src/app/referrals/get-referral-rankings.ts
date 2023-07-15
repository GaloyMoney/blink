type GetUserReferralRankingsProps = {
    referralRange: ReferralRange
    paginationArgs?: PaginationArgs
}

export const getUserReferralRankings = async (props: GetUserReferralRankingsProps): Promise<ReferralRanking[] | ApplicationError> => {
    throw new Error("Not implemented")
}
