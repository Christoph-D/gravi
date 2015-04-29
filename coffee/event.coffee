return makeListenable: (Type) ->
  if Type::eventFire?
    return Type
  class ListenableType extends Type
    constructor: ->
      @_listeners = {}
      @_listenersPerm = {}
      super

    eventListenOnce: (event, listener) ->
      if @_listeners[event]?
        @_listeners[event].push(listener)
      else
        @_listeners[event] = [listener]
      @

    eventListen: (event, listener) ->
      if @_listenersPerm[event]?
        @_listenersPerm[event].push(listener)
      else
        @_listenersPerm[event] = [listener]
      @

    eventRemovePermanentListeners: (event) ->
      delete @_listeners[event]
      @

    eventFire: (event, args...) ->
      if @_listeners[event]?
        for f in @_listeners[event]
          f.apply(this, args)
        delete @_listeners[event]
      if @_listenersPerm[event]?
        for f in @_listenersPerm[event]
          f.apply(this, args)
      @
