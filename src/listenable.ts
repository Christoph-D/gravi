// This module exports the class Listenable.  Inheriting from this
// class allows an object to dispatch and respond to events.  With
// onStatic() you can also register event handlers on a derived class
// itself, making all instances of the derived class respond to an
// event with the same handler.
//
// An event handler gets as arguments whatever the dispatch() function
// received.  The `this` value in an event handler will be set to the
// current instance, even for static handlers.
//
// a.on("foo", callback) registers a callback for the event "foo" on
// the object a, which should be an instance of a subclass of
// Listenable.
//
// SomeType.onStatic("foo", callback) registers a callback for the
// event "foo" for every instance of SomeType, assuming that SomeType
// inherits from Listenable.  Static event handlers cannot be removed.
//
// a.on("foo", "bar") and SomeType.onStatic("foo", "bar") chain "foo"
// to "bar".  That is, every time a "foo" event is dispatched, at an
// unspecified point in between the calls of the "foo" handlers, a
// "bar" event will be dispatched.  This is shorthand for a.on("foo",
// function() { this.dispatch("foo") }).
//
// a.dispatch("foo") calls in an unspecified order every handler
// registered for the event "foo".

type Listener = (...args: any[]) => void;

function makeForwardingFunction(listener: string | Listener): Listener {
  if(typeof listener === "string")
    return function(x) { return function() { this.dispatch(listener); }; }(listener);
  return listener as Listener;
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
  if(Reflect.getOwnPropertyDescriptor(self, "listenersStatic") === undefined) {
    const newListenersMap = new Map<string, Listener[]>();
    self.listenersStatic.forEach(
      (listeners, event) => newListenersMap.set(event, listeners.slice()));
    self.listenersStatic = newListenersMap;
  }
}

export default class Listenable {
  public static listenersStatic: Map<string, Listener[]>;

  public static onStatic(event: string, listener: Listener | string) {
    initializeStaticListeners(this);
    addListener(this.listenersStatic, event, listener);
    return this;
  }

  private _listenersOneshot: Map<string, Listener[]>;
  private _listeners: Map<string, Listener[]>;

  constructor() {
    // These internal variables should not be enumerable.
    for(const p of ["_listenersOneshot", "_listeners"]) {
      Reflect.defineProperty(this, p, {
        configurable: true,
        enumerable: false,
        value: new Map<string, Listener>(),
        writable: true,
      });
    }
  }

  public on(event: string, listener: Listener | string, options: any = {}) {
    if(options.once)
      addListener(this._listenersOneshot, event, listener);
    else
      addListener(this._listeners, event, listener);
    return this;
  }

  public removeListeners(event: string) {
    this._listeners.delete(event);
    return this;
  }

  public dispatch(event: string, ...args: any[]) {
    if(this._listenersOneshot.has(event)) {
      for(const f of this._listenersOneshot.get(event)!)
        Reflect.apply(f, this, args);
      this._listenersOneshot.delete(event);
    }
    if(this._listeners.has(event))
      for(const f of this._listeners.get(event)!)
        Reflect.apply(f, this, args);
    if((this.constructor as typeof Listenable).listenersStatic !== undefined &&
       (this.constructor as typeof Listenable).listenersStatic.has(event))
      for(const f of (this.constructor as typeof Listenable).listenersStatic.get(event)!)
        Reflect.apply(f, this, args);
    return this;
  }
}
// Initialize the list of static listeners.
Listenable.listenersStatic = new Map<string, Listener[]>();
