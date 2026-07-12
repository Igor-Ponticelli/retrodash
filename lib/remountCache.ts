// In-memory cache scoped to the module. Create once per hook, at module
// scope, so the store survives a component unmount/remount within the same
// tab (e.g. [locale] remounting everything below it on a locale switch),
// while being cleared for free on any full page reload. No TTL/eviction:
// data volume is small (a handful of rooms/users per tab) and doesn't
// justify the complexity.
export function createRemountCache<T>() {
  const store = new Map<string, T>();
  return {
    has: (key: string) => store.has(key),
    get: (key: string) => store.get(key),
    set: (key: string, value: T) => {
      store.set(key, value);
    },
  };
}
