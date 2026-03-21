const store = Object.create(null)

globalThis.localStorage = {
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
  },
  setItem(key, value) {
    store[key] = String(value)
  },
  removeItem(key) {
    delete store[key]
  },
  clear() {
    for (const key of Object.keys(store)) {
      delete store[key]
    }
  }
}
