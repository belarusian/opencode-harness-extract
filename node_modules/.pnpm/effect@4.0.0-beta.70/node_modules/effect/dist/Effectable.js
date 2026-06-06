import { evaluate, makePrimitiveProto } from "./internal/core.js";
/**
 * Create a low-level `Effect` prototype.
 *
 * **Details**
 *
 * When the effect is evaluated, it calls `evaluate` with the current fiber.
 *
 * @category Prototypes
 * @since 4.0.0
 */
export const Prototype = options => makePrimitiveProto({
  op: options.label,
  [evaluate]: options.evaluate
});
const Base = /*#__PURE__*/(() => {
  const Base = function () {};
  Base.prototype = /*#__PURE__*/Prototype({
    label: "Effectable",
    evaluate(_) {
      return this;
    }
  });
  return Base;
})();
/**
 * An abstract class that can be extended to create an `Effect`.
 *
 * @category constructors
 * @since 2.0.0
 */
export class Class extends Base {}
//# sourceMappingURL=Effectable.js.map