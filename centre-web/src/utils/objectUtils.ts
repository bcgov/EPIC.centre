type DeepReadonly<T> = T extends (...args: unknown[]) => unknown
  ? T
  : T extends Array<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

export function deepFreeze<T>(obj: T): DeepReadonly<T> {
  const seen = new WeakSet<object>();

  function internalFreeze<X>(target: X): DeepReadonly<X> {
    if (target === null || typeof target !== "object")
      return target as DeepReadonly<X>;
    // Already processed?
    if (seen.has(target as object)) return target as DeepReadonly<X>;
    seen.add(target as object);

    // Freeze own string and symbol keys
    const props = Object.getOwnPropertyNames(target).concat(
      Object.getOwnPropertySymbols(target) as any,
    );

    props.forEach((prop) => {
      const value = (target as any)[prop];
      if (value && typeof value === "object" && !Object.isFrozen(value)) {
        internalFreeze(value);
      }
    });

    return Object.freeze(target) as DeepReadonly<X>;
  }

  return internalFreeze(obj);
}
