type QuizzesSectionsConfig = typeof import("./sections").QuizzesSectionsConfig
export type QuizQuestionId = QuizzesSectionsConfig[number]["quiz"][number]
