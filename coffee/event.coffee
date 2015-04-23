return class Event
  constructor: (@parent) ->
    @listeners = {}
    @listenersPerm = {}

  listenOnce: (event, listener) ->
    if @listeners[event]?
      @listeners[event].push(listener)
    else
      @listeners[event] = [listener]
    @

  listen: (event, listener) ->
    if @listenersPerm[event]?
      @listenersPerm[event].push(listener)
    else
      @listenersPerm[event] = [listener]
    @

  removePermanentListeners: (event) ->
    delete @listeners[event]
    @

  fire: (event) ->
    if @listeners[event]?
      for f in @listeners[event]
        f.call(@parent)
      delete @listeners[event]
    if @listenersPerm[event]?
      for f in @listenersPerm[event]
        f.call(@parent)
    @
