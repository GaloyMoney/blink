export const createReferralProfileState = (): ReferralProfileState => {
  let timeOfSnapshot: Date | undefined = undefined // Is it okay that this changes?
  const referralProfileForAccount: Map<AccountId, ReferralProfile> = new Map()

  const getReferralProfileForAccount = (accountId: AccountId) => {
    return (
      referralProfileForAccount.get(accountId) ||
      createReferralProfile({
        accountId,
      })
    )
  }

  const updateTime = (currentTime: Date) => {
    if (
      timeOfSnapshot &&
      isNewMonth({
        newDate: currentTime,
        oldDate: timeOfSnapshot,
      })
    ) {
      referralProfileForAccount.forEach((referralProfile, accountId) => {
        referralProfileForAccount.set(accountId, {
          ...referralProfile,
          thisMonthReferralCount: 0,
          thisMonthOuterReferralCount: 0,
        })
      })
    }

    timeOfSnapshot = currentTime
  }

  const consumeReferral = (referral: Referral) => {
    updateTime(referral.timestamp)

    const referringPersonProfile = getReferralProfileForAccount(referral.referringAccount)
    referralProfileForAccount.set(
      referral.referringAccount,
      addReferralToProfile(referringPersonProfile),
    )

    if (!referral.referringReferringAccount) {
      return
    }

    const referringReferringProfile = getReferralProfileForAccount(
      referral.referringReferringAccount,
    )
    referralProfileForAccount.set(
      referral.referringReferringAccount,
      addOuterReferralToProfile(referringReferringProfile),
    )
  }

  return {
    timeOfSnapshot,
    getReferralProfileForAccount,
    updateTime,
    consumeReferral,
  }
}

export const addReferralToProfile = (referralProfile: ReferralProfile) => {
  return {
    ...referralProfile,
    thisMonthReferralCount: referralProfile.thisMonthReferralCount + 1,
    totalReferralCount: referralProfile.totalReferralCount + 1,
  }
}

export const addOuterReferralToProfile = (referralProfile: ReferralProfile) => {
  return {
    ...referralProfile,
    thisMonthOuterReferralCount: referralProfile.thisMonthOuterReferralCount + 1,
    totalOuterReferralCount: referralProfile.totalOuterReferralCount + 1,
  }
}

export const createReferralProfile = (
  props: CreateReferralProfileProps,
): ReferralProfile => {
  return {
    ...props,
    totalOuterReferralCount: 0,
    totalReferralCount: 0,
    thisMonthOuterReferralCount: 0,
    thisMonthReferralCount: 0,
  }
}

const isNewMonth = ({ newDate, oldDate }: { newDate: Date; oldDate: Date }) => {
  return (
    newDate.getMonth() !== oldDate.getMonth() ||
    newDate.getFullYear() !== oldDate.getFullYear()
  )
}
