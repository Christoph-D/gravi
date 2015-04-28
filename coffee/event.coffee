return makeListenable: (Type) ->
  if Type::eventFire?
    return Type
  class ListenableType extends Type
    constructor: (@parent) ->
      @listeners = {}
      @listenersPerm = {}
      super

    eventStaticListenOnce: (event, listener) ->
      if @listeners[event]?
        @listeners[event].push(listener)
      else
        @listeners[event] = [listener]
      @

    eventListen: (event, listener) ->
      if @listenersPerm[event]?
        @listenersPerm[event].push(listener)
      else
        @listenersPerm[event] = [listener]
      @

    eventRemovePermanentListeners: (event) ->
      delete @listeners[event]
      @

    eventFire: (event) ->
      args = Array.prototype.slice.call(arguments, 1)
      if @listeners[event]?
        for f in @listeners[event]
          f.apply(@parent, args)
        delete @listeners[event]
      if @listenersPerm[event]?
        for f in @listenersPerm[event]
          f.apply(@parent, args)
      @
