# Contributing

This repo is built and maintained by the Galoy team. We welcome and appreciate new contributions and encourage you to check out the repo and [join our community](https://chat.galoy.io/) to get started.

To help get you started, we will explain a bit about how we've laid out the code here and some of the practices we use. Our layout details fall mostly into two categories:
- [Working with Types](#working-with-types)
- [Understanding our Architecture](#architecture)

---

## Working with Types
This codebase is implemented using a well-typed approach where we rely on Typescript for catching & enforcing certain kinds of checks we would like to perform.

This approach helps to strenghthen guarantees that bugs/issues don't get to runtime unhandled if our types are implemented properly.

### Our Approach
We define all our types in declaration files (`*.d.ts`) where typescript automatically adds any types to the context without needing to explicitly import. Declaration files have limitations on what can be imported & instantiated within them, so in the few cases where types derive from instances of things we would usually have to use special tricks to derive them.

The majority of our types are defined in the `domain` layer (see Architecture section below). We generally create types for the following scenarios:

#### Symbol types
These are unique types that are alternatives to generically typing things as Typescript's primitive types (e.g. `string`, `number`, `boolean`). Doing this helps us to add context to primitive types that we pass around and it allows the type checked to distinguish between different kinds of primitives throughout the code.

For example, an onchain address and a lightning network payment request are both strings, but they aren't interchangeable as a data type. Instead of using `string` type for these types we would define as follows using a "unique symbol":

```
type EncodedPaymentRequest = string & { readonly brand: unique symbol }

type OnChainAddress = string & { readonly brand: unique symbol }

```

#### Error types

These are types mostly used in function signature type definitions. They derive from implemented error classes and need to be imported in a special way to their type declaration file.

For example, an error may be defined in a module's `error.ts` file like this:
```
export class LightningError extends DomainError {
  name = this.constructor.name
}
```

and then it is imported to its `index.types.d.ts` declaration file and made into a type like this:
```
type LightningError = import("./errors").LightningError
```


#### Imported Library types

In the places where we would like to work with types defined in imported libraries, we have two options. When we would like to use them directly, we can simply import them. If we would like to re-use a type to create our own types, we would re-import to get those types into our declaration files.

For example, for a result type from the `lightning` library, we would import and re-use it like:
```
type GetPaymentResult = import("lightning").GetPaymentResult
type RawPaths = NonNullable<GetPaymentResult["payment"]>["paths"]
```

In this example, we need the type definition for the `payment.paths` property of the `GetPaymentResult` type from the library that we otherwise would not have direct access to.


#### Function signatures and argument types
Whenever we implement a new function, the argument and return types are assigned at the point of the function's implementation.

For example:
```ts
const myFunction = async (myArg: MyArg): Promise<ThingResult> => {
    return doThing(myArg)
}

const myOtherFunction = async ({
  myFirstArg,
  mySecondArg,
}: {
  myFirstArg: MyFirstArg
  mySecondArg: MySecondArg
}): Promise<ThingResult> => {
  return doThing(myFirstArg, mySecondArg)
}

```

In cases where the function has a complex set of arguments, the argument type can be defined in a declaration file and then assigned at the point of function implementation.

```ts
// in '.d.ts' file
type MyFuncArgs = {
    myFirstArg: MyFirstArg
    mySecondArg: MySecondArg
}

// in other file
const myFunction = async ({
  myFirstArg,
  mySecondArg,
}: MyFuncArgs): Promise<ThingResult> => {
  return doThing(myFirstArg, mySecondArg)
}
```

#### Defining objects with methods
We use functional constructors to define certain types of objects that we can call method on. The intention here is to instantiate the object first and then call methods on that object with method-specific args to execute some functionality.

For objects like these, the interface for the object is defined using a `type` declaration and methods are typed at this point.

For example, our fee calculator is typed as follows:
```ts
// In '.d.ts' file
type DepositFeeCalculator = {
  onChainDepositFee({ amount, ratio }: onChainDepositFeeArgs): Satoshis
  lnDepositFee(): Satoshis
}

// In implementation file
export const DepositFeeCalculator = (): DepositFeeCalculator => {
  const onChainDepositFee = ({ amount, ratio }: onChainDepositFeeArgs) => {
    return toSats(Math.round(amount * ratio))
  }

  return {
    onChainDepositFee,
    lnDepositFee: () => toSats(0),
  }
}
```

Note that the top-level function arguments (for `DepositFeeCalculator`) would still be typed at the point of implementation like with any other function, and it is only the method signatures that are included in declaration files.

#### Interfaces
We use the `interface` keyword to define objects with methods that are intended to be implemented outside of the domain. This most often happens with service implementations like our `ILightningService` interface that gets implemented as the `LndService` function.

Everything else about how we go about typing and implementing things with the `interface` keyword is the same as with how we handle "objects with methods" in our domain as described above.

#### "Enums" via object constants
Typescript's `enum` keyword has drawbacks that don't fully meet our typing needs. To get around this, we use the trick where we define our intended enum as a standard object and then import it into our type declarations.

For example:
```ts
// In implementation file
export const AccountStatus = {
  Locked: "locked",
  Active: "active",
} as const

// In declaration file
type AccountStatus =
  typeof import("./index").AccountStatus[keyof typeof import("./index").AccountStatus]
```
## Architecture
We use hexagonal architecture pattern ([context](https://blog.ndepend.com/hexagonal-architecture/)).

Code goes into one of four layers:
- Domain layer (`./src/domain`)
- Services layer (`./src/services`)
- Application layer (`./src/app`)
- Application Access layer (`./src/servers`)

### Domain layer
Defines the models and business logic with related interfaces.

#### Responsibility
- Define all data types
- Implement operations on the data types that depends on conditionals or data transformations
- Define interfaces of external services

#### Dependencies
- Internal: None
- External: only utility libraries but must be as clean as possible


### Services layer
Implements all the adapters (specific implementations of the interfaces defined in domain layer) that use external services/resources

#### Responsibility
- Implement interfaces defined in domain layer

#### Examples
- Access to external resources (database, redis, bitcoind, lnd)
- Consumption of external services/APIs (twilio, geetest, price, hedging)

#### Dependencies
- Internal: Domain Layer
- External: all required dependencies


### Application layer
Implements the API of our solution, i.e. will be the access point for components/servers in the access application layer.

#### Responsibility
- Implement application logic

#### Examples
- Wallet methods (pay, getTransactions, …)

#### Dependencies
- Internal: Domain Layer. Keep in mind that access to services implementation must be through “indirect access”, i.e. the access application layer or the wiring up code/layer must create/inject them. (_AR `TODO`: double-check this_)
- External: only utility libraries that do not go against domain layer definition (Ex: lodash)



### Application Access layer

Responsible for wiring up the other layers and/or exposing the application to external clients or consumers.

This layer will have the entry points used by the infrastructure (pods).

#### Responsibility
- Entrypoint for the various use-case methods defined in the Application layer

#### Examples
- Cron jobs
- Http servers: Middleware related logic (JWT, graphql, …)
- Triggers

#### Dependencies
- Internal: Domain Layer, Application Layer and Services Layer. (_AR `TODO`: Confirm that this is not just Application layer_)
- External: all required dependencies required to expose the application (expressjs, apollo server, …)



## Spans

Notes on our instrumentation approach and how this is reflected in the codebase.
