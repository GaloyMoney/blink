import { GraphQLError } from "graphql";

export const messageCode: { [key: string]: MessageCodeInterface } = {
  INTERNAL_SERVER_ERROR: {
    messageCode: "INTERNAL_SERVER_ERROR",
    statusCode: 500,
    message: "Internal server Error",
  },
  BAD_USER_INPUT: {
    messageCode: "BAD_USER_INPUT",
    statusCode: 400,
    message: "Invalid input",
  },
  
};

interface MessageCodeInterface {
  message: string;
  statusCode: number;
  messageCode: string;
}

export class CustomError extends Error {
  public messageCode: string;
  public customMessage?: string;

  constructor(messageCode: string, customMessage?: string) {
    super(messageCode);
    this.name = "CustomError";
    this.messageCode = messageCode;
    this.customMessage = customMessage;
  }
}

export function createCustomError(
  messageCodeData: MessageCodeInterface,
  ErrorData?: Error
): never {
  if (ErrorData instanceof CustomError) {
    const customMessageCode = ErrorData.messageCode;
    const customMessage =
      ErrorData.customMessage || messageCode[customMessageCode].message;
    const customStatusCode = messageCode[customMessageCode].statusCode;
    throw new GraphQLError(customMessage, {
      extensions: {
        code: customMessageCode,
        http: {
          status: customStatusCode,
        },
      },
    });
  } else {
    throw new GraphQLError(messageCodeData.message, {
      extensions: {
        code: messageCodeData.messageCode,
        http: {
          status: messageCodeData.statusCode,
        },
      },
    });
  }
}
