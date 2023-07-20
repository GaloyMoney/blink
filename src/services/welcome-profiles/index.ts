let _welcomeProfiles: WelcomeProfile[] = []

export const WelcomeProfileRepository = (): IWelcomeProfileRepository => {
  const save = (welcomeProfiles: WelcomeProfile[]) => {
    _welcomeProfiles = welcomeProfiles
  }

  const getLeaders = () => {
    return _welcomeProfiles
  }

  return { save, getLeaders }
}
