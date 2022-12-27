import { toSats } from "@domain/bitcoin"
import { InvalidQuizQuestionIdError } from "@domain/errors"
import { toSeconds } from "@domain/primitives"

export const checkedForQuizQuestionId = (id: string) => {
  const quizId = id as QuizQuestionId
  if (QuizQuestionIds[quizId] === undefined) return new InvalidQuizQuestionIdError()
  return quizId
}

// onboarding
export const onboardingEarn: Record<QuizQuestionId, QuizData> = {
  whatIsBitcoin: {
    amount: toSats(1),
    needs: undefined,
  },
  sat: { amount: toSats(2), needs: { id: "whatIsBitcoin", minInterval: toSeconds(5) } },
  whereBitcoinExist: {
    amount: toSats(5),
    needs: { id: "sat", minInterval: toSeconds(5) },
  },
  whoControlsBitcoin: {
    amount: toSats(5),
    needs: { id: "whereBitcoinExist", minInterval: toSeconds(5) },
  },
  copyBitcoin: {
    amount: toSats(5),
    needs: { id: "whoControlsBitcoin", minInterval: toSeconds(5) },
  },
  moneyImportantGovernement: {
    amount: toSats(10),
    needs: { id: "copyBitcoin", minInterval: toSeconds(5) },
  },
  moneyIsImportant: {
    amount: toSats(10),
    needs: { id: "moneyImportantGovernement", minInterval: toSeconds(5) },
  },
  whyStonesShellGold: {
    amount: toSats(10),
    needs: { id: "moneyIsImportant", minInterval: toSeconds(5) },
  },
  moneyEvolution: {
    amount: toSats(10),
    needs: { id: "whyStonesShellGold", minInterval: toSeconds(5) },
  },
  coincidenceOfWants: {
    amount: toSats(10),
    needs: { id: "moneyEvolution", minInterval: toSeconds(5) },
  },
  moneySocialAggrement: {
    amount: toSats(10),
    needs: { id: "coincidenceOfWants", minInterval: toSeconds(5) },
  },
  WhatIsFiat: {
    amount: toSats(10),
    needs: { id: "moneySocialAggrement", minInterval: toSeconds(5) },
  },
  whyCareAboutFiatMoney: {
    amount: toSats(10),
    needs: { id: "WhatIsFiat", minInterval: toSeconds(5) },
  },
  GovernementCanPrintMoney: {
    amount: toSats(10),
    needs: { id: "whyCareAboutFiatMoney", minInterval: toSeconds(5) },
  },
  FiatLosesValueOverTime: {
    amount: toSats(10),
    needs: { id: "GovernementCanPrintMoney", minInterval: toSeconds(5) },
  },
  OtherIssues: {
    amount: toSats(10),
    needs: { id: "FiatLosesValueOverTime", minInterval: toSeconds(5) },
  },
  LimitedSupply: {
    amount: toSats(20),
    needs: { id: "OtherIssues", minInterval: toSeconds(5) },
  },
  Decentralized: {
    amount: toSats(20),
    needs: { id: "LimitedSupply", minInterval: toSeconds(5) },
  },
  NoCounterfeitMoney: {
    amount: toSats(20),
    needs: { id: "Decentralized", minInterval: toSeconds(5) },
  },
  HighlyDivisible: {
    amount: toSats(20),
    needs: { id: "NoCounterfeitMoney", minInterval: toSeconds(5) },
  },
  securePartOne: {
    amount: toSats(20),
    needs: { id: "HighlyDivisible", minInterval: toSeconds(5) },
  },
  securePartTwo: {
    amount: toSats(20),
    needs: { id: "securePartOne", minInterval: toSeconds(5) },
  },
}

export const QuizQuestionIds = {
  whatIsBitcoin: "whatIsBitcoin",
  sat: "sat",
  whereBitcoinExist: "whereBitcoinExist",
  whoControlsBitcoin: "whoControlsBitcoin",
  copyBitcoin: "copyBitcoin",
  moneyImportantGovernement: "moneyImportantGovernement",
  moneyIsImportant: "moneyIsImportant",
  whyStonesShellGold: "whyStonesShellGold",
  moneyEvolution: "moneyEvolution",
  coincidenceOfWants: "coincidenceOfWants",
  moneySocialAggrement: "moneySocialAggrement",
  WhatIsFiat: "WhatIsFiat",
  whyCareAboutFiatMoney: "whyCareAboutFiatMoney",
  GovernementCanPrintMoney: "GovernementCanPrintMoney",
  FiatLosesValueOverTime: "FiatLosesValueOverTime",
  OtherIssues: "OtherIssues",
  LimitedSupply: "LimitedSupply",
  Decentralized: "Decentralized",
  NoCounterfeitMoney: "NoCounterfeitMoney",
  HighlyDivisible: "HighlyDivisible",
  securePartOne: "securePartOne",
  securePartTwo: "securePartTwo",
} as const
