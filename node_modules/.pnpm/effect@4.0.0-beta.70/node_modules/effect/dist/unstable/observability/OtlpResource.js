/**
 * Helpers and data types for describing the OTLP resource attached to exported
 * logs, metrics, and traces.
 *
 * A resource identifies the service that produced telemetry and carries
 * process- or deployment-level attributes that should be shared across every
 * signal sent by the Effect OTLP logger, metrics exporter, and tracer. Use this
 * module when building explicit resource metadata, reading the standard OTEL
 * resource environment variables, or converting application metadata into OTLP
 * `KeyValue` / `AnyValue` shapes before serialization.
 *
 * `service.name` is required because the signal exporters also use it as the
 * instrumentation scope name. Explicit resource options take precedence over
 * `OTEL_RESOURCE_ATTRIBUTES`, `OTEL_SERVICE_NAME`, and
 * `OTEL_SERVICE_VERSION`; `service.name` and `service.version` are normalized
 * through the service metadata inputs and re-added as canonical OTLP
 * attributes rather than left in the custom attribute map. Attribute values are
 * converted to OTLP scalar or array values where possible, with unsupported
 * runtime values formatted as strings.
 *
 * @since 4.0.0
 */
import * as Config from "../../Config.js";
import * as Effect from "../../Effect.js";
import { format } from "../../Formatter.js";
import * as Schema from "../../Schema.js";
/**
 * Creates an OTLP resource from service metadata and additional attributes.
 *
 * **Details**
 *
 * The resource always includes `service.name`, includes `service.version` when
 * provided, and converts custom attributes into OTLP attribute values.
 *
 * @category constructors
 * @since 4.0.0
 */
export const make = options => {
  const resourceAttributes = options.attributes ? entriesToAttributes(Object.entries(options.attributes)) : [];
  resourceAttributes.push({
    key: "service.name",
    value: {
      stringValue: options.serviceName
    }
  });
  if (options.serviceVersion) {
    resourceAttributes.push({
      key: "service.version",
      value: {
        stringValue: options.serviceVersion
      }
    });
  }
  return {
    attributes: resourceAttributes,
    droppedAttributesCount: 0
  };
};
/**
 * Creates an OTLP resource from explicit options and OpenTelemetry
 * configuration.
 *
 * **Details**
 *
 * Explicit options override `OTEL_RESOURCE_ATTRIBUTES`, `OTEL_SERVICE_NAME`,
 * and `OTEL_SERVICE_VERSION`; missing required configuration is converted to a
 * defect.
 *
 * @category constructors
 * @since 4.0.0
 */
export const fromConfig = /*#__PURE__*/Effect.fnUntraced(function* (options) {
  const attributes = {
    ...(yield* Config.schema(Schema.UndefinedOr(Config.Record(Schema.String, Schema.String)), "OTEL_RESOURCE_ATTRIBUTES")),
    ...options?.attributes
  };
  const serviceName = options?.serviceName ?? attributes["service.name"] ?? (yield* Config.schema(Schema.String, "OTEL_SERVICE_NAME"));
  delete attributes["service.name"];
  const serviceVersion = options?.serviceVersion ?? attributes["service.version"] ?? (yield* Config.schema(Schema.UndefinedOr(Schema.String), "OTEL_SERVICE_VERSION"));
  delete attributes["service.version"];
  return make({
    serviceName,
    serviceVersion,
    attributes
  });
}, Effect.orDie);
/**
 * Returns the `service.name` attribute from an OTLP resource.
 *
 * **Gotchas**
 *
 * Throws if the resource does not contain a string `service.name` attribute.
 *
 * @category Attributes
 * @since 4.0.0
 */
export const serviceNameUnsafe = resource => {
  const serviceNameAttribute = resource.attributes.find(attr => attr.key === "service.name");
  if (!serviceNameAttribute || !serviceNameAttribute.value.stringValue) {
    throw new Error("Resource does not contain a service name");
  }
  return serviceNameAttribute.value.stringValue;
};
/**
 * Converts key/value entries into OTLP `KeyValue` attributes.
 *
 * @category Attributes
 * @since 4.0.0
 */
export const entriesToAttributes = entries => {
  const attributes = [];
  for (const [key, value] of entries) {
    attributes.push({
      key,
      value: unknownToAttributeValue(value)
    });
  }
  return attributes;
};
/**
 * Converts an arbitrary JavaScript value into an OTLP `AnyValue`.
 *
 * **Details**
 *
 * Arrays are converted recursively, primitive values use their matching OTLP
 * fields, and unsupported values are formatted as strings.
 *
 * @category Attributes
 * @since 4.0.0
 */
export const unknownToAttributeValue = value => {
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(unknownToAttributeValue)
      }
    };
  }
  switch (typeof value) {
    case "string":
      return {
        stringValue: value
      };
    case "bigint":
      return {
        intValue: Number(value)
      };
    case "number":
      return Number.isInteger(value) ? {
        intValue: value
      } : {
        doubleValue: value
      };
    case "boolean":
      return {
        boolValue: value
      };
    default:
      return {
        stringValue: format(value)
      };
  }
};
//# sourceMappingURL=OtlpResource.js.map