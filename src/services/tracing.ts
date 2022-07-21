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
  SpanAttributes,
  SpanStatusCode,
  SpanOptions,
  TimeInput,
  Exception,
  Context,
} from "@opentelemetry/api"
import { tracingConfig } from "@config"
import { ErrorLevel } from "@domain/shared"

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
  const firstErr = errors[0]
  if (firstErr.message != "") {
    span.setAttribute(`graphql.${subPath}error.message`, firstErr.message)
  }
  if (firstErr.constructor?.name) {
    span.setAttribute(`graphql.${subPath}error.type`, firstErr.constructor.name)
  }
  if (firstErr.path) {
    span.setAttribute(`graphql.${subPath}error.path`, firstErr.path.join("."))
  }
  if (firstErr.extensions?.code) {
    span.setAttribute(`graphql.${subPath}error.code`, firstErr.extensions.code)
  }
  if (firstErr.originalError) {
    if (firstErr.originalError.constructor?.name) {
      span.setAttribute(
        `graphql.${subPath}error.original.type`,
        firstErr.originalError.constructor.name,
      )
    }
    if (firstErr.originalError.message != "") {
      span.setAttribute(
        `graphql.${subPath}error.original.message`,
        firstErr.originalError.message,
      )
    }
  }

  // @ts-ignore-next-line no-implicit-any error
  errors.forEach((err, idx) => {
    if (err.message != "") {
      span.setAttribute(`graphql.${subPath}error.${idx}.message`, err.message)
    }
    if (err.constructor?.name) {
      span.setAttribute(`graphql.${subPath}error.${idx}.type`, err.constructor.name)
    }
    if (err.path) {
      span.setAttribute(`graphql.${subPath}error.${idx}.path`, err.path.join("."))
    }
    if (err.extensions?.code) {
      span.setAttribute(`graphql.${subPath}error.${idx}.code`, err.extensions.code)
    }
    if (err.originalError) {
      if (err.originalError.constructor?.name != "") {
        span.setAttribute(
          `graphql.${subPath}error.${idx}.original.type`,
          err.originalError.constructor.name,
        )
      }
      if (err.originalError.message != "") {
        span.setAttribute(
          `graphql.${subPath}error.${idx}.original.message`,
          err.originalError.message,
        )
      }
    }
  })
}

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation({
      ignoreIncomingPaths: ["/healthz"],
      headersToSpanAttributes: {
        server: {
          requestHeaders: ["apollographql-client-name", "apollographql-client-version"],
        },
      },
    }),
    new GraphQLInstrumentation({
      mergeItems: true,
      allowValues: true,
      // @ts-expect-error: type mismatch for some reasons
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
      [SemanticResourceAttributes.SERVICE_NAME]: tracingConfig.tracingServiceName,
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
      host: tracingConfig.jaegerHost,
      port: tracingConfig.jaegerPort,
    }),
  ),
)

provider.register()

export const tracer = trace.getTracer(
  tracingConfig.tracingServiceName,
  process.env.COMMITHASH || "dev",
)
export const addAttributesToCurrentSpan = (attributes: SpanAttributes) => {
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
  attributesOrStartTime?: SpanAttributes | TimeInput | undefined,
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
  attributes?: SpanAttributes
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

const recordException = (span: Span, exception: Exception, level?: ErrorLevel) => {
  // @ts-ignore-next-line no-implicit-any error
  const errorLevel = level || exception["level"] || ErrorLevel.Warn
  span.setAttribute("error.level", errorLevel)
  // @ts-ignore-next-line no-implicit-any error
  span.setAttribute("error.name", exception["name"])
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
  spanAttributes?: SpanAttributes
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
  spanAttributes?: SpanAttributes
  root?: boolean
}) => {
  return (...args: A): R => {
    const functionName = fnName || fn.name || "unknown"
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
  spanAttributes?: SpanAttributes
  root?: boolean
}) => {
  return (...args: A): Promise<PromiseReturnType<R>> => {
    const functionName = fnName || fn.name || "unknown"
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
    // @ts-ignore-next-line no-implicit-any error
    const fnType = fns[fn].constructor.name
    if (fnType === "Function") {
      // @ts-ignore-next-line no-implicit-any error
      functions[fn] = wrapToRunInSpan({
        namespace,
        // @ts-ignore-next-line no-implicit-any error
        fn: fns[fn],
        fnName: fn,
      })
      continue
    }

    if (fnType === "AsyncFunction") {
      // @ts-ignore-next-line no-implicit-any error
      functions[fn] = wrapAsyncToRunInSpan({
        namespace,
        // @ts-ignore-next-line no-implicit-any error
        fn: fns[fn],
        fnName: fn,
      })
      continue
    }
    // @ts-ignore-next-line no-implicit-any error
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
