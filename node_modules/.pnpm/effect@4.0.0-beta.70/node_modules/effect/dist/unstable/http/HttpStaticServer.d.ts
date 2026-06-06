/**
 * Static file serving for Effect HTTP applications.
 *
 * This module builds request handlers and router layers that serve files from a
 * configured root directory. It is intended for public assets such as compiled
 * front-end bundles, images, fonts, downloads, documentation sites, and single
 * page applications that need an `index.html` fallback.
 *
 * Requests are resolved relative to the configured root after decoding and
 * normalizing the URL path. Malformed paths, null bytes, and `..` traversal
 * outside the root are rejected, but the module still serves anything the
 * configured `FileSystem` can reach below that root. Keep secrets out of the
 * served tree, be careful with symlinks or generated files, and remember that
 * dotfiles are not hidden automatically. File responses include content type,
 * optional cache control, byte-range support, and conditional request handling
 * based on the metadata supplied by `HttpPlatform`.
 *
 * @since 4.0.0
 */
import * as Effect from "../../Effect.ts";
import * as FileSystem from "../../FileSystem.ts";
import * as Layer from "../../Layer.ts";
import * as Path from "../../Path.ts";
import type { PlatformError } from "../../PlatformError.ts";
import * as HttpPlatform from "./HttpPlatform.ts";
import * as HttpRouter from "./HttpRouter.ts";
import * as HttpServerError from "./HttpServerError.ts";
import * as HttpServerRequest from "./HttpServerRequest.ts";
import * as HttpServerResponse from "./HttpServerResponse.ts";
/**
 * Creates an `HttpApp` that serves files from a directory.
 *
 * **Example** (Serving files from a directory)
 *
 * ```ts
 * import { Effect } from "effect"
 * import { HttpStaticServer } from "effect/unstable/http"
 *
 * const program = Effect.gen(function*() {
 *   const app = yield* HttpStaticServer.make({ root: "./public" })
 *   return app
 * })
 * ```
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const make: (options: {
    readonly root: string;
    readonly index?: string | undefined;
    readonly spa?: boolean | undefined;
    readonly cacheControl?: string | undefined;
    readonly mimeTypes?: Record<string, string> | undefined;
}) => Effect.Effect<Effect.Effect<HttpServerResponse.HttpServerResponse, HttpServerError.HttpServerError, HttpServerRequest.HttpServerRequest>, PlatformError, FileSystem.FileSystem | Path.Path | HttpPlatform.HttpPlatform>;
/**
 * Creates a layer that mounts static files on an `HttpRouter`.
 *
 * **Example** (Mounting static files on a router)
 *
 * ```ts
 * import { Layer } from "effect"
 * import { HttpRouter, HttpServerResponse, HttpStaticServer } from "effect/unstable/http"
 *
 * const ApiLayer = HttpRouter.add("GET", "/health", HttpServerResponse.text("ok"))
 *
 * const StaticFilesLayer = HttpStaticServer.layer({
 *   root: "./public",
 *   prefix: "/static"
 * })
 *
 * const AppLayer = Layer.mergeAll(ApiLayer, StaticFilesLayer)
 * ```
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layer: (options: {
    readonly root: string;
    readonly index?: string | undefined;
    readonly spa?: boolean | undefined;
    readonly cacheControl?: string | undefined;
    readonly mimeTypes?: Record<string, string> | undefined;
    readonly prefix?: string | undefined;
}) => Layer.Layer<never, PlatformError, HttpRouter.HttpRouter | FileSystem.FileSystem | Path.Path | HttpPlatform.HttpPlatform>;
//# sourceMappingURL=HttpStaticServer.d.ts.map