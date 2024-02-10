// Importing necessary modules from OpenTelemetry packages
import { context, trace } from "@opentelemetry/api"
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web"
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch"
import { ZoneContextManager } from "@opentelemetry/context-zone"
import { B3Propagator } from "@opentelemetry/propagator-b3"
import { registerInstrumentations } from "@opentelemetry/instrumentation"

// Define the initialization function
export default function initializeTelemetry() {
  const provider = new WebTracerProvider()

  provider.addSpanProcessor(new SimpleSpanProcessor(new OTLPTraceExporter()))
  provider.register({
    contextManager: new ZoneContextManager(),
    propagator: new B3Propagator(),
  })

  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        ignoreUrls: [/localhost:8090\/sockjs-node/],
        propagateTraceHeaderCorsUrls: [
          "https://cors-test.appspot.com/test",
          "https://httpbin.org/get",
        ],
        clearTimingResources: true,
      }),
    ],
  })

  // Example of how you might use the provider to create a tracer
  // This example function doesn't do anything by itself but is here to show how you might use it
  const webTracerWithZone = provider.getTracer("example-tracer-web")

  // Placeholder for any setup logic you might have
  console.log("OpenTelemetry initialized")
}

// Note: This file does not include the event listener setup from the original otel.js example,
// as those are typically handled within the components or pages themselves in a React application.
