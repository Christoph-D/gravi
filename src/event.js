function addListener(where, event, listener) {
  if(event in where)
    where[event].push(listener);
  else
    where[event] = [listener];
}

const listenersStaticPerm = {};

export default class Listenable {
  constructor() {
    this._listeners = {};
    this._listenersPerm = {};
  }

  on(event, listener, options = {}) {
    if(options.once)
      addListener(this._listeners, event, listener);
    else
      addListener(this._listenersPerm, event, listener);
    return this;
  }

  static onStatic(event, listener) {
    if(this == Listenable)
      throw Error("Cannot add a static listener to Listenable directly.  Please use a subclass.");
    if(this.listenersStaticPerm == null)
      this.listenersStaticPerm = {};
    addListener(this.listenersStaticPerm, event, listener);
    return this;
  }

  static removeStaticListeners(event) {
    if(this.listenersStaticPerm != null)
      delete this.listenersStaticPerm[event];
    return this;
  }

  removePermanentListeners(event) {
    delete this._listenersPerm[event];
    return this;
  }

  dispatch(event, ...args) {
    if(event in this._listeners) {
      for(let f of this._listeners[event])
        f.apply(this, args);
      delete this._listeners[event];
    }
    if(event in this._listenersPerm)
      for(let f of this._listenersPerm[event])
        f.apply(this, args);
    if(this.constructor.listenersStaticPerm != null && event in this.constructor.listenersStaticPerm)
      for(let f of this.constructor.listenersStaticPerm[event])
        f.apply(this, args);
    return this;
  }
}
