import {
  SemanticAttributes,
  SemanticResourceAttributes,
} from "@opentelemetry/semantic-conventions"
import type * as graphqlTypes from "graphql"
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
} from "@opentelemetry/api"
import { tracingConfig } from "@config/app"

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
    const nestedObjData = data.data?.[nestedObj]
    if (!nestedObjData) continue

    if (nestedObjData.errors && nestedObjData.errors.length > 0) {
      recordGqlErrors({ errors: nestedObjData.errors, span, subPathName: nestedObj })
    }
  }
}

const recordGqlErrors = ({ errors, span, subPathName }) => {
  const subPath = subPathName ? `${subPathName}.` : ""

  span.recordException({
    name: `graphql.${subPath}execution.error`,
    message: JSON.stringify(errors),
  })
  span.setStatus({
    code: SpanStatusCode.ERROR,
  })
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
  onStart(span: SdkSpan) {
    const ctx = context.active()
    if (ctx) {
      const baggage = propagation.getBaggage(ctx)
      if (baggage) {
        baggage.getAllEntries().forEach(([key, entry]) => {
          span.setAttribute(key, entry.value)
        })
      }
    }
    super.onStart(span)
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

export const asyncRunInSpan = <F extends () => ReturnType<F>>(
  spanName: string,
  attributes: SpanAttributes,
  fn: F,
) => {
  const ret = tracer.startActiveSpan(spanName, { attributes }, async (span) => {
    const ret = await Promise.resolve(fn())
    if ((ret as unknown) instanceof Error) {
      span.recordException(ret)
    }
    span.end()
    return ret
  })
  return ret
}

const resolveFunctionSpanOptions = ({
  namespace,
  functionName,
  functionArgs,
  spanAttributes,
}: {
  namespace: string
  functionName: string
  functionArgs: Array<unknown>
  spanAttributes: SpanAttributes
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
      attributes[`${SemanticAttributes.CODE_FUNCTION}.params.${key}`] = params[key]
      attributes[`${SemanticAttributes.CODE_FUNCTION}.params.${key}.null`] =
        params[key] === null
    }
  }
  return { attributes }
}

export const wrapToRunInSpan = <
  A extends Array<unknown>,
  R extends PartialResult<unknown> | unknown,
>({
  fn,
  namespace,
}: {
  fn: (...args: A) => R
  namespace: string
}) => {
  return (...args: A): R => {
    const functionName = fn.name
    const spanName = `${namespace}.${functionName}`
    const spanOptions = resolveFunctionSpanOptions({
      namespace,
      functionName,
      functionArgs: args,
      spanAttributes: {},
    })
    const ret = tracer.startActiveSpan(spanName, spanOptions, (span) => {
      try {
        const ret = fn(...args)
        if (ret instanceof Error) span.recordException(ret)
        const partialRet = ret as PartialResult<unknown>
        if (partialRet?.partialResult && partialRet?.error)
          span.recordException(partialRet.error)
        span.end()
        return ret
      } catch (error) {
        span.recordException(error)
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
  namespace,
}: {
  fn: (...args: A) => Promise<PromiseReturnType<R>>
  namespace: string
}) => {
  return (...args: A): Promise<PromiseReturnType<R>> => {
    const functionName = fn.name
    const spanName = `${namespace}.${functionName}`
    const spanOptions = resolveFunctionSpanOptions({
      namespace,
      functionName,
      functionArgs: args,
      spanAttributes: {},
    })
    const ret = tracer.startActiveSpan(spanName, spanOptions, async (span) => {
      try {
        const ret = await fn(...args)
        if (ret instanceof Error) span.recordException(ret)
        const partialRet = ret as PartialResult<unknown>
        if (partialRet?.partialResult && partialRet?.error)
          span.recordException(partialRet.error)
        span.end()
        return ret
      } catch (error) {
        span.recordException(error)
        span.end()
        throw error
      }
    })
    return ret
  }
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

export const ENDUSER_ALIAS = "enduser.alias"
