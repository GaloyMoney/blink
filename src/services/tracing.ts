import {
  SemanticAttributes,
  SemanticResourceAttributes,
} from "@opentelemetry/semantic-conventions"
import { W3CTraceContextPropagator } from "@opentelemetry/core"
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node"
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http"
import { GraphQLInstrumentation } from "@opentelemetry/instrumentation-graphql"
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb'
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis'
import { GrpcInstrumentation } from '@opentelemetry/instrumentation-grpc'
import { registerInstrumentations } from "@opentelemetry/instrumentation"
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { JaegerExporter } from "@opentelemetry/exporter-jaeger"
import { Resource } from "@opentelemetry/resources"
import { trace, context, propagation, SpanAttributes } from "@opentelemetry/api"
import { tracingConfig } from "@config/app"

propagation.setGlobalPropagator(new W3CTraceContextPropagator())

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation({
      ignoreIncomingPaths: ["/healthz"]
    }),
    new GraphQLInstrumentation({
      mergeItems: true
    }),
    new MongoDBInstrumentation(),
    new GrpcInstrumentation(),
    new IORedisInstrumentation()
  ]
})

const provider = new NodeTracerProvider({
  resource: Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: tracingConfig.tracingServiceName,
    }),
  ),
})

const jaegerExporter = new JaegerExporter({
  host: tracingConfig.jaegerHost,
  port: tracingConfig.jaegerPort,
})
provider.addSpanProcessor(new SimpleSpanProcessor(jaegerExporter))

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
export const asyncRunInSpan = <
  A extends unknown[],
  F extends (...args: A) => ReturnType<F>,
>(
  spanName: string,
  attributes: SpanAttributes,
  fn: F,
  ...args: A
) => {
  const ret = tracer.startActiveSpan(spanName, { attributes }, async (span) => {
    const ret = await Promise.resolve(fn(...args))
    if ((ret as unknown) instanceof Error) {
      span.recordException(ret)
    }
    span.end()
    return ret
  })
  return ret
}

export { SemanticAttributes, SemanticResourceAttributes }
