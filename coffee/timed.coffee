class TimedProperty
  constructor: (initialValue = null, @interpolate = false) ->
    @value = { 0: initialValue }

  interpolate = (x, y, t) ->
    if typeof x != typeof y
      throw "Cannot interpolate between different types."
    if typeof x == "number"
      return x * (1 - t) + y * t
    result = {}
    for own key of x
      result[key] = interpolate(x[key], y[key], t)
    return result

  valueAtTime: (time, value) ->
    if arguments.length == 2
      @value[time] = value
    else
      lastTime = Math.max.apply(null, v for own v of @value when v <= time)
      if @interpolate
        nextTime = Math.min.apply(null, v for own v of @value when v > lastTime)
        if nextTime == Number.POSITIVE_INFINITY
          return @value[lastTime]
        normedDiff = (time - lastTime) / (nextTime - lastTime)
        return interpolate @value[lastTime], @value[nextTime], normedDiff
      else
        return @value[lastTime]

  clear: () ->
    @value = { 0: @value[0] }
