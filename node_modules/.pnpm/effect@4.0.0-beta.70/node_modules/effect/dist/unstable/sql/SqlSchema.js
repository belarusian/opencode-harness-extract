/**
 * Schema-driven helpers for wrapping SQL executions in typed query functions.
 *
 * This module connects `Schema` request and result definitions to an `execute`
 * callback that runs the actual SQL statement. The returned functions accept
 * the request schema's decoded `Type`, encode it to the SQL-facing `Encoded`
 * shape, run the callback, and then decode unknown driver rows through the
 * result schema. This is useful for repository methods, CRUD helpers, request
 * resolvers, and write operations where callers should work with domain values
 * instead of raw SQL parameters or rows.
 *
 * The `execute` callback always receives `Req["Encoded"]`, so schema
 * transformations, required encoding services, and database representations
 * such as nullable columns, JSON values, dates, and bigints must line up with
 * the statement builder and dialect in use. Result schemas decode the rows
 * returned by the driver after any SQL client row transforms; `findOne` and
 * `findOneOption` only inspect the first row, `findNonEmpty` requires at least
 * one row, and `void` discards any driver result after request encoding.
 *
 * @since 4.0.0
 */
import * as Arr from "../../Array.js";
import * as Cause from "../../Cause.js";
import * as Effect from "../../Effect.js";
import * as Schema from "../../Schema.js";
/**
 * Builds a query function that encodes the request, decodes all result rows,
 * and fails with `NoSuchElementError` when the result set is empty.
 *
 * @category constructors
 * @since 4.0.0
 */
export const findAll = options => {
  const encodeRequest = Schema.encodeEffect(options.Request);
  const decode = Schema.decodeUnknownEffect(Schema.mutable(Schema.Array(options.Result)));
  return request => Effect.flatMap(Effect.flatMap(encodeRequest(request), options.execute), decode);
};
/**
 * Run a sql query with a request schema and a result schema.
 *
 * @category constructors
 * @since 4.0.0
 */
export const findNonEmpty = options => {
  const find = findAll(options);
  return request => Effect.flatMap(find(request), results => Arr.isArrayNonEmpty(results) ? Effect.succeed(results) : Effect.fail(new Cause.NoSuchElementError()));
};
const void_ = options => {
  const encode = Schema.encodeEffect(options.Request);
  return request => Effect.asVoid(Effect.flatMap(encode(request), options.execute));
};
export {
/**
 * Run a sql query with a request schema and discard the result.
 *
 * @category constructors
 * @since 4.0.0
 */
void_ as void };
/**
 * Builds a query function that encodes the request, decodes the first result
 * row, and fails with `NoSuchElementError` when no rows are returned.
 *
 * @category constructors
 * @since 4.0.0
 */
export const findOne = options => {
  const encodeRequest = Schema.encodeEffect(options.Request);
  const decode = Schema.decodeUnknownEffect(options.Result);
  return request => Effect.flatMap(Effect.flatMap(encodeRequest(request), options.execute), arr => Arr.isReadonlyArrayNonEmpty(arr) ? decode(arr[0]) : Effect.fail(new Cause.NoSuchElementError()));
};
/**
 * Builds a query function that encodes the request, decodes the first result row
 * as `Option.some`, and returns `Option.none` when no rows are returned.
 *
 * @category constructors
 * @since 4.0.0
 */
export const findOneOption = options => {
  const encodeRequest = Schema.encodeEffect(options.Request);
  const decode = Schema.decodeUnknownEffect(options.Result);
  return request => Effect.flatMap(Effect.flatMap(encodeRequest(request), options.execute), arr => Arr.isReadonlyArrayNonEmpty(arr) ? Effect.asSome(decode(arr[0])) : Effect.succeedNone);
};
//# sourceMappingURL=SqlSchema.js.map