const store = new Map();

export function withCache(fn, keyPrefix, ttl = 30000) {
  return (...args) => {
    const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
    const now = Date.now();
    const entry = store.get(cacheKey);

    if (entry) {
      if (now < entry.expiresAt) {
        return Promise.resolve(entry.data);
      }
      fn(...args)
        .then(data => { store.set(cacheKey, { data, expiresAt: now + ttl }); })
        .catch(() => {});
      return Promise.resolve(entry.data);
    }

    return fn(...args).then(data => {
      store.set(cacheKey, { data, expiresAt: Date.now() + ttl });
      return data;
    });
  };
}

export function invalidateCache(pattern) {
  if (!pattern) { store.clear(); return; }
  for (const key of store.keys()) {
    if (key.startsWith(pattern)) store.delete(key);
  }
}
