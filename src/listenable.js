function addListener(where, event, listener) {
  const l = where.get(event);
  if(l === undefined)
    where.set(event, [listener]);
  else
    l.push(listener);
}
function initializeStaticListeners(self) {
  // Every subclass of Listenable should have their own list of static
  // listeners.
  if(Reflect.getOwnPropertyDescriptor(self, "listenersStaticPerm") === undefined) {
    const newListenersMap = new Map;
    self.listenersStaticPerm.forEach(
      (listeners, event) => newListenersMap.set(event, listeners.slice()));
    self.listenersStaticPerm = newListenersMap;
  }
}

export default class Listenable {
  constructor() {
    // These internal variables should not be enumerable.
    for(const p of ["_listeners", "_listenersPerm"]) {
      Reflect.defineProperty(this, p, {
        configurable: true,
        writable: true,
        enumerable: false,
        value: new Map
      });
    }
  }

  on(event, listener, options = {}) {
    if(options.once)
      addListener(this._listeners, event, listener);
    else
      addListener(this._listenersPerm, event, listener);
    return this;
  }

  static onStatic(event, listener) {
    initializeStaticListeners(this);
    addListener(this.listenersStaticPerm, event, listener);
    return this;
  }

  static removeStaticListeners(event) {
    initializeStaticListeners(this);
    this.listenersStaticPerm.delete(event);
    return this;
  }

  removePermanentListeners(event) {
    this._listenersPerm.delete(event);
    return this;
  }

  dispatch(event, ...args) {
    if(this._listeners.has(event)) {
      for(const f of this._listeners.get(event))
        Reflect.apply(f, this, args);
      this._listeners.delete(event);
    }
    if(this._listenersPerm.has(event))
      for(const f of this._listenersPerm.get(event))
        Reflect.apply(f, this, args);
    if(this.constructor.listenersStaticPerm !== undefined &&
       this.constructor.listenersStaticPerm.has(event))
      for(const f of this.constructor.listenersStaticPerm.get(event))
        Reflect.apply(f, this, args);
    return this;
  }
}
// Initialize the list of static listeners.
Listenable.listenersStaticPerm = new Map;
