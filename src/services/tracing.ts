/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-nocheck

import {
  SemanticAttributes,
  SemanticResourceAttributes,
} from "@opentelemetry/semantic-conventions"
import { W3CTraceContextPropagator } from "@opentelemetry/core"
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node"
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http"
import { GraphQLInstrumentation } from "@opentelemetry/instrumentation-graphql"
import { MongoDBInstrumentation } from "@opentelemetry/instrumentation-mongodb"
import { IORedisInstrumentation } from "@opentelemetry/instrumentation-ioredis"
import { GrpcInstrumentation } from "@opentelemetry/instrumentation-grpc"
import { registerInstrumentations } from "@opentelemetry/instrumentation"
import { SimpleSpanProcessor, Span as SdkSpan } from "@opentelemetry/sdk-trace-base"
import { JaegerExporter } from "@opentelemetry/exporter-jaeger"
import { Resource } from "@opentelemetry/resources"
import {
  trace,
  context,
  propagation,
  Span,
  Attributes,
  SpanStatusCode,
  SpanOptions,
  TimeInput,
  Exception,
  Context,
} from "@opentelemetry/api"
import { tracingConfig } from "@config"
import { ErrorLevel, RankedErrorLevel } from "@domain/shared"

import type * as graphqlTypes from "graphql"

propagation.setGlobalPropagator(new W3CTraceContextPropagator())

// FYI this hook is executed BEFORE the `formatError` hook from apollo
// The data.errors field here may still change before being returned to the client
const gqlResponseHook = (span: Span, data: graphqlTypes.ExecutionResult) => {
  if (data.errors && data.errors.length > 0) {
    recordGqlErrors({ errors: data.errors, span, subPathName: "" })
  }

  let gqlNestedKeys: string[] = []
  if (data.data) {
    gqlNestedKeys = Object.keys(data.data)
  }
  for (const nestedObj of gqlNestedKeys) {
    const nestedObjData = data.data?.[nestedObj] as Required<{
      errors: IError[]
    }>
    if (!nestedObjData) continue
    if (nestedObjData.errors && nestedObjData.errors.length > 0) {
      recordGqlErrors({ errors: nestedObjData.errors, span, subPathName: nestedObj })
    }
  }
}

const recordGqlErrors = ({
  errors,
  span,
  subPathName,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any
  span: Span
  subPathName: string
}) => {
  const subPath = subPathName ? `${subPathName}.` : ""

  recordException(
    span,
    {
      name: `graphql.${subPath}execution.error`,
      message: JSON.stringify(errors),
    },
    ErrorLevel.Warn,
  )

  const setErrorAttribute = ({ attribute, value }) =>
    span.setAttribute(`graphql.${subPath ? "data." : subPath}error.${attribute}`, value)

  const firstErr = errors[0]
  if (subPath) {
    setErrorAttribute({
      attribute: `operation.name`,
      value: subPath.split(".").join(""), // remove trailing '.'
    })
  }

  setErrorAttribute({
    attribute: "message",
    value: firstErr.message,
  })

  setErrorAttribute({
    attribute: "type",
    value: firstErr.constructor?.name,
  })

  setErrorAttribute({
    attribute: "path",
    value: firstErr.path,
  })

  setErrorAttribute({
    attribute: "code",
    value: firstErr.extensions?.code || firstErr.code,
  })

  if (firstErr.originalError) {
    setErrorAttribute({
      attribute: "original.type",
      value: firstErr.originalError.constructor?.name,
    })

    setErrorAttribute({
      attribute: "original.message",
      value: firstErr.originalError.message,
    })
  }

  // @ts-ignore-next-line no-implicit-any error
  errors.forEach((err, idx) => {
    setErrorAttribute({
      attribute: `${idx}.message`,
      value: err.message,
    })

    setErrorAttribute({
      attribute: `${idx}.type`,
      value: err.constructor?.name,
    })

    setErrorAttribute({
      attribute: `${idx}.path`,
      value: err.path,
    })

    setErrorAttribute({
      attribute: `${idx}.code`,
      value: err.extensions?.code || err.code,
    })

    if (err.originalError) {
      setErrorAttribute({
        attribute: `${idx}.original.type`,
        value: err.originalError.constructor?.name,
      })

      setErrorAttribute({
        attribute: `${idx}.original.message`,
        value: err.originalError.message,
      })
    }
  })
}

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation({
      ignoreIncomingPaths: ["/healthz"],
      headersToSpanAttributes: {
        server: {
          requestHeaders: [
            "apollographql-client-name",
            "apollographql-client-version",
            "x-real-ip",
            "x-forwarded-for",
            "user-agent",
          ],
        },
      },
    }),
    new GraphQLInstrumentation({
      mergeItems: true,
      allowValues: true,
      responseHook: gqlResponseHook,
    }),
    new MongoDBInstrumentation(),
    new GrpcInstrumentation(),
    new IORedisInstrumentation(),
  ],
})

const provider = new NodeTracerProvider({
  resource: Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: tracingConfig?.tracingServiceName,
    }),
  ),
})

class SpanProcessorWrapper extends SimpleSpanProcessor {
  onStart(span: SdkSpan, parentContext: Context) {
    const ctx = context.active()
    if (ctx) {
      const baggage = propagation.getBaggage(ctx)
      if (baggage) {
        baggage.getAllEntries().forEach(([key, entry]) => {
          span.setAttribute(key, entry.value)
        })
      }
    }
    super.onStart(span, parentContext)
  }
}
provider.addSpanProcessor(
  new SpanProcessorWrapper(
    new JaegerExporter({
      host: tracingConfig?.jaegerHost,
      port: tracingConfig?.jaegerPort,
    }),
  ),
)

provider.register()

export const tracer = trace.getTracer(
  tracingConfig?.tracingServiceName,
  process.env.COMMITHASH || "dev",
)
export const addAttributesToCurrentSpan = (attributes: Attributes) => {
  const span = trace.getSpan(context.active())
  if (span) {
    for (const [key, value] of Object.entries(attributes)) {
      if (value) {
        span.setAttribute(key, value)
      }
    }
  }
}

export const addEventToCurrentSpan = (
  name: string,
  attributesOrStartTime?: Attributes | TimeInput | undefined,
  startTime?: TimeInput | undefined,
) => {
  const span = trace.getSpan(context.active())
  if (span) {
    span.addEvent(name, attributesOrStartTime, startTime)
  }
}

export const recordExceptionInCurrentSpan = ({
  error,
  level,
  attributes,
}: {
  error: Exception
  level?: ErrorLevel
  attributes?: Attributes
}) => {
  const span = trace.getSpan(context.active())
  if (!span) return

  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      if (value) span.setAttribute(key, value)
    }
  }

  recordException(span, error, level)
}

const updateErrorForSpan = ({
  span,
  errorLevel,
}: {
  span: Span
  errorLevel: ErrorLevel
}): boolean => {
  const spanErrorRank = RankedErrorLevel.indexOf(span.attributes["error.level"])
  const errorRank = RankedErrorLevel.indexOf(errorLevel)

  return errorRank >= spanErrorRank
}

const recordException = (span: Span, exception: Exception, level?: ErrorLevel) => {
  const errorLevel = level || exception["level"] || ErrorLevel.Warn

  // Write error attributes if update checks pass
  if (updateErrorForSpan({ span, errorLevel })) {
    span.setAttribute("error.level", errorLevel)
    span.setAttribute("error.name", exception["name"])
    span.setAttribute("error.message", exception["message"])
  }

  // Append error with next index
  let nextIdx = 0
  while (span.attributes[`error.${nextIdx}.level`] !== undefined) {
    nextIdx++
  }
  span.setAttribute(`error.${nextIdx}.level`, errorLevel)
  span.setAttribute(`error.${nextIdx}.name`, exception["name"])
  span.setAttribute(`error.${nextIdx}.message`, exception["message"])

  span.recordException(exception)
  span.setStatus({ code: SpanStatusCode.ERROR })
}

export const asyncRunInSpan = <F extends () => ReturnType<F>>(
  spanName: string,
  options: SpanOptions,
  fn: F,
) => {
  const ret = tracer.startActiveSpan(spanName, options, async (span) => {
    try {
      const ret = await Promise.resolve(fn())
      if ((ret as unknown) instanceof Error) {
        recordException(span, ret as Error)
      }
      span.end()
      return ret
    } catch (error) {
      recordException(span, error, ErrorLevel.Critical)
      span.end()
      throw error
    }
  })
  return ret
}

const resolveFunctionSpanOptions = ({
  namespace,
  functionName,
  functionArgs,
  spanAttributes,
  root,
}: {
  namespace: string
  functionName: string
  functionArgs: Array<unknown>
  spanAttributes?: Attributes
  root?: boolean
}): SpanOptions => {
  const attributes = {
    [SemanticAttributes.CODE_FUNCTION]: functionName,
    [SemanticAttributes.CODE_NAMESPACE]: namespace,
    ...spanAttributes,
  }
  if (functionArgs && functionArgs.length > 0) {
    const params =
      typeof functionArgs[0] === "object" ? functionArgs[0] : { "0": functionArgs[0] }
    for (const key in params) {
      // @ts-ignore-next-line no-implicit-any error
      const value = params[key]
      attributes[`${SemanticAttributes.CODE_FUNCTION}.params.${key}`] = value
      attributes[`${SemanticAttributes.CODE_FUNCTION}.params.${key}.null`] =
        value === null
      attributes[`${SemanticAttributes.CODE_FUNCTION}.params.${key}.undefined`] =
        value === undefined
    }
  }
  return { attributes, root }
}

export const wrapToRunInSpan = <
  A extends Array<unknown>,
  R extends PartialResult<unknown> | unknown,
>({
  fn,
  fnName,
  namespace,
  spanAttributes,
  root,
}: {
  fn: (...args: A) => R
  fnName?: string
  namespace: string
  spanAttributes?: Attributes
  root?: boolean
}) => {
  const functionName = fnName || fn.name || "unknown"

  const wrappedFn = (...args: A): R => {
    const spanName = `${namespace}.${functionName}`
    const spanOptions = resolveFunctionSpanOptions({
      namespace,
      functionName,
      functionArgs: args,
      spanAttributes,
      root,
    })
    const ret = tracer.startActiveSpan(spanName, spanOptions, (span) => {
      try {
        const ret = fn(...args)
        if (ret instanceof Error) recordException(span, ret)
        const partialRet = ret as PartialResult<unknown>
        if (partialRet?.partialResult && partialRet?.error)
          recordException(span, partialRet.error)
        span.end()
        return ret
      } catch (error) {
        recordException(span, error, ErrorLevel.Critical)
        span.end()
        throw error
      }
    })
    return ret
  }

  // Re-add the original name to the wrapped function
  Object.defineProperty(wrappedFn, "name", {
    value: functionName,
    configurable: true,
  })

  return wrappedFn
}

type PromiseReturnType<T> = T extends Promise<infer Return> ? Return : T

export const wrapAsyncToRunInSpan = <
  A extends Array<unknown>,
  R extends PartialResult<unknown> | unknown,
>({
  fn,
  fnName,
  namespace,
  spanAttributes,
  root,
}: {
  fn: (...args: A) => Promise<PromiseReturnType<R>>
  fnName?: string
  namespace: string
  spanAttributes?: Attributes
  root?: boolean
}) => {
  const functionName = fnName || fn.name || "unknown"

  const wrappedFn = (...args: A): Promise<PromiseReturnType<R>> => {
    const spanName = `${namespace}.${functionName}`
    const spanOptions = resolveFunctionSpanOptions({
      namespace,
      functionName,
      functionArgs: args,
      spanAttributes,
      root,
    })
    const ret = tracer.startActiveSpan(spanName, spanOptions, async (span) => {
      try {
        const ret = await fn(...args)
        if (ret instanceof Error) recordException(span, ret)
        const partialRet = ret as PartialResult<unknown>
        if (partialRet?.partialResult && partialRet?.error)
          recordException(span, partialRet.error)
        span.end()
        return ret
      } catch (error) {
        recordException(span, error, ErrorLevel.Critical)
        span.end()
        throw error
      }
    })
    return ret
  }

  // Re-add the original name to the wrapped function
  Object.defineProperty(wrappedFn, "name", {
    value: functionName,
    configurable: true,
  })

  return wrappedFn
}

export const wrapAsyncFunctionsToRunInSpan = <F extends object>({
  namespace,
  fns,
}: {
  namespace: string
  fns: F
}): F => {
  const functions = { ...fns }
  for (const fn of Object.keys(functions)) {
    const fnType = fns[fn].constructor.name
    if (fnType === "Function") {
      functions[fn] = wrapToRunInSpan({
        namespace,
        fn: fns[fn],
        fnName: fn,
      })
      continue
    }

    if (fnType === "AsyncFunction") {
      functions[fn] = wrapAsyncToRunInSpan({
        namespace,
        fn: fns[fn],
        fnName: fn,
      })
      continue
    }
    functions[fn] = fns[fn]
  }
  return functions
}

export const addAttributesToCurrentSpanAndPropagate = <F extends () => ReturnType<F>>(
  attributes: { [key: string]: string | undefined },
  fn: F,
) => {
  const ctx = context.active()
  let baggage = propagation.getBaggage(ctx) || propagation.createBaggage()
  const currentSpan = trace.getSpan(ctx)
  Object.entries(attributes).forEach(([key, value]) => {
    if (value) {
      baggage = baggage.setEntry(key, { value })
      if (currentSpan) {
        currentSpan.setAttribute(key, value)
      }
    }
  })
  return context.with(propagation.setBaggage(ctx, baggage), fn)
}

export const shutdownTracing = async () => {
  provider.shutdown()
}

export { SemanticAttributes, SemanticResourceAttributes }

export const ACCOUNT_USERNAME = "account.username"
