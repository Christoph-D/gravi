return makeListenable: (Type) ->
  if Type::on?
    return Type
  class ListenableType extends Type
    constructor: ->
      @_listeners = {}
      @_listenersPerm = {}
      super

    addListener = (where, event, listener) ->
      if where[event]?
        where[event].push(listener)
      else
        where[event] = [listener]

    on: (event, listener, options = {}) ->
      if options.once
        addListener(@_listeners, event, listener)
      else
        addListener(@_listenersPerm, event, listener)
      @

    _listenersStaticPerm = {}

    @onStatic: (event, listener) ->
      addListener(_listenersStaticPerm, event, listener)
      @

    @eventStaticRemoveListeners: (event) ->
      delete _listenersStaticPerm[event]
      @

    eventRemovePermanentListeners: (event) ->
      delete @_listenersPerm[event]
      @

    dispatch: (event, args...) ->
      if @_listeners[event]?
        for f in @_listeners[event]
          f.apply(this, args)
        delete @_listeners[event]
      if @_listenersPerm[event]?
        for f in @_listenersPerm[event]
          f.apply(this, args)
      if _listenersStaticPerm[event]?
        for f in _listenersStaticPerm[event]
          f.apply(this, args)
      @
