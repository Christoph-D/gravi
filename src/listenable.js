function addListener(where, event, listener) {
  if(event in where)
    where[event].push(listener);
  else
    where[event] = [listener];
}

export default class Listenable {
  constructor() {
    // These internal variables should not be enumerable.
    for(const p of ["_listeners", "_listenersPerm"]) {
      Reflect.defineProperty(this, p, {
        configurable: true,
        writable: true,
        enumerable: false,
        value: {}
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
    if(this === Listenable)
      throw Error("Cannot add a static listener to Listenable directly.  Please use a subclass.");
    if(this.listenersStaticPerm == null)
      this.listenersStaticPerm = {};
    addListener(this.listenersStaticPerm, event, listener);
    return this;
  }

  static removeStaticListeners(event) {
    if(this.listenersStaticPerm != null)
      Reflect.deleteProperty(this.listenersStaticPerm, event);
    return this;
  }

  removePermanentListeners(event) {
    Reflect.deleteProperty(this._listenersPerm, event);
    return this;
  }

  dispatch(event, ...args) {
    if(event in this._listeners) {
      for(const f of this._listeners[event])
        Reflect.apply(f, this, args);
      Reflect.deleteProperty(this._listeners, event);
    }
    if(event in this._listenersPerm)
      for(const f of this._listenersPerm[event])
        Reflect.apply(f, this, args);
    if(this.constructor.listenersStaticPerm != null && event in this.constructor.listenersStaticPerm)
      for(const f of this.constructor.listenersStaticPerm[event])
        Reflect.apply(f, this, args);
    return this;
  }
}
