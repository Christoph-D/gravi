type Listener = (...args: any[]) => void;

function makeForwardingFunction(listener: string | Listener): Listener {
  if(typeof listener === "string")
    return function(x) { return function() { this.dispatch(x); }; }(listener);
  return <Listener>listener;
}
function addListener(where: Map<string, Listener[]>, event: string, listener: string | Listener) {
  const l = where.get(event);
  if(l === undefined)
    where.set(event, [makeForwardingFunction(listener)]);
  else
    l.push(makeForwardingFunction(listener));
}

function initializeStaticListeners(self: typeof Listenable) {
  // Every subclass of Listenable should have their own list of static
  // listeners.
  if(Reflect.getOwnPropertyDescriptor(self, "listenersStaticPerm") === undefined) {
    const newListenersMap = new Map<string, Listener[]>();
    self.listenersStaticPerm.forEach(
      (listeners, event) => newListenersMap.set(event, listeners.slice()));
    self.listenersStaticPerm = newListenersMap;
  }
}

export default class Listenable {
  static listenersStaticPerm: Map<string, Listener[]>;

  static onStatic(event: string, listener: Listener | string) {
    initializeStaticListeners(this);
    addListener(this.listenersStaticPerm, event, listener);
    return this;
  }

  private _listeners: Map<string, Listener[]>;
  private _listenersPerm: Map<string, Listener[]>;

  constructor() {
    // These internal variables should not be enumerable.
    for(const p of ["_listeners", "_listenersPerm"]) {
      Reflect.defineProperty(this, p, {
        configurable: true,
        writable: true,
        enumerable: false,
        value: new Map<string, Listener>(),
      });
    }
  }

  on(event: string, listener: Listener | string, options: any = {}) {
    if(options.once)
      addListener(this._listeners, event, listener);
    else
      addListener(this._listenersPerm, event, listener);
    return this;
  }

  removePermanentListeners(event: string) {
    this._listenersPerm.delete(event);
    return this;
  }

  dispatch(event: string, ...args: any[]) {
    if(this._listeners.has(event)) {
      for(const f of this._listeners.get(event)!)
        Reflect.apply(f, this, args);
      this._listeners.delete(event);
    }
    if(this._listenersPerm.has(event))
      for(const f of this._listenersPerm.get(event)!)
        Reflect.apply(f, this, args);
    if((<typeof Listenable>this.constructor).listenersStaticPerm !== undefined &&
       (<typeof Listenable>this.constructor).listenersStaticPerm.has(event))
      for(const f of (<typeof Listenable>this.constructor).listenersStaticPerm.get(event)!)
        Reflect.apply(f, this, args);
    return this;
  }
}
// Initialize the list of static listeners.
Listenable.listenersStaticPerm = new Map<string, Listener[]>();
