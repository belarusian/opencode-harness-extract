/**
 * The `HttpApiScalar` module mounts an interactive Scalar API reference for a
 * declarative `HttpApi`.
 *
 * Use this module when you want a browser-friendly documentation page for an
 * `HttpApi` without maintaining a separate OpenAPI document. The `layer`
 * helper registers a `GET` route on an `HttpRouter`, generates the OpenAPI
 * specification with `OpenApi.fromApi`, embeds it into the HTML page, and loads
 * the bundled Scalar browser script. `layerCdn` provides the same UI while
 * loading Scalar from jsDelivr, optionally pinned with `version`.
 *
 * The mounted path is a documentation UI route, defaulting to `/docs`, rather
 * than a raw JSON specification endpoint. If clients, gateways, or external
 * documentation pipelines need the OpenAPI document directly, expose it
 * separately with `HttpApiBuilder.layer`'s `openapiPath` option. Scalar
 * configuration is forwarded to the page through `ScalarConfig`; values such as
 * `proxyUrl`, theme and layout settings, and `baseServerURL` matter when
 * enabling "Test Request", styling the docs, or rendering relative server URLs
 * outside the browser origin.
 *
 * @since 4.0.0
 */
import * as Effect from "../../Effect.js";
import * as HttpRouter from "../http/HttpRouter.js";
import * as HttpServerResponse from "../http/HttpServerResponse.js";
import * as Html from "./internal/html.js";
import * as internal from "./internal/httpApiScalar.js";
import * as OpenApi from "./OpenApi.js";
const makeHandler = options => {
  const spec = OpenApi.fromApi(options.api);
  const scalarConfig = {
    _integration: "html",
    ...options.scalar
  };
  const response = HttpServerResponse.html(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${Html.escape(spec.info.title)}</title>
    ${!spec.info.description ? "" : `<meta name="description" content="${Html.escape(spec.info.description)}"/>`}
    ${!spec.info.description ? "" : `<meta name="og:description" content="${Html.escape(spec.info.description)}"/>`}
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script id="api-reference" type="application/json">
      ${Html.escapeJson(spec)}
    </script>
    <script>
      document.getElementById('api-reference').dataset.configuration = JSON.stringify(${Html.escapeJson(scalarConfig)})
    </script>
    ${options.source._tag === "Cdn" ? `<script src="${`https://cdn.jsdelivr.net/npm/@scalar/api-reference@${options.source.version ?? "latest"}/dist/browser/standalone.min.js`}" crossorigin></script>` : `<script>${options.source.source}</script>`}
  </body>
</html>`);
  return Effect.succeed(response);
};
/**
 * Mounts a Scalar API reference page for an `HttpApi` using the bundled Scalar script.
 *
 * **Details**
 *
 * The route serves the OpenAPI specification generated from the API at the
 * configured path, defaulting to `/docs`.
 *
 * @category layers
 * @since 4.0.0
 */
export const layer = (api, options) => HttpRouter.use(Effect.fnUntraced(function* (router) {
  const handler = makeHandler({
    api,
    source: {
      _tag: "Inline",
      source: internal.javascript
    },
    scalar: options?.scalar
  });
  yield* router.add("GET", options?.path ?? "/docs", handler);
}));
/**
 * Mounts a Scalar API reference page for an `HttpApi` that loads Scalar from jsDelivr.
 *
 * **Details**
 *
 * The route serves the OpenAPI specification generated from the API at the
 * configured path, defaulting to `/docs`; `version` selects the Scalar package
 * version loaded from the CDN.
 *
 * @category layers
 * @since 4.0.0
 */
export const layerCdn = (api, options) => HttpRouter.use(Effect.fnUntraced(function* (router) {
  const handler = makeHandler({
    api,
    source: {
      _tag: "Cdn",
      version: options?.version
    },
    scalar: options?.scalar
  });
  yield* router.add("GET", options?.path ?? "/docs", handler);
}));
//# sourceMappingURL=HttpApiScalar.js.map