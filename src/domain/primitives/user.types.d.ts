declare const usernameSymbol: unique symbol
type Username = string & { [usernameSymbol]: never }
