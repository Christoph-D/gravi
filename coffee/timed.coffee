class TimedProperty
  constructor: (initialValue = null) ->
    @value = { 0: initialValue }

  valueAtTime: (time, value) ->
    if arguments.length == 2
      @value[time] = value
    else
      --time while time > 0 and not @value[time]?
      return @value[time]

  clear: () ->
    @value = { 0: @value[0] }
