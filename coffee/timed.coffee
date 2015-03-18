`define(function(require){`

return class TimedProperty
  constructor: (@initialValue = null, @interpolateKeys = []) ->
    @value = { 0: @initialValue }

  interpolate: (x, y, t) ->
    result = {}
    for key in @interpolateKeys
      throw "Missing key: #{key}" unless key of x and key of y
      result[key] = x[key] * (1 - t) + y[key] * t
    return result

  valueAtTime: (time, value) ->
    if arguments.length == 2
      @value[time] = value
    else
      lastTime = Math.max.apply(null, v for own v of @value when v <= time)
      if @interpolateKeys.length > 0
        nextTime = Math.min.apply(null, v for own v of @value when v > lastTime)
        if nextTime == Number.POSITIVE_INFINITY
          return @value[lastTime]
        normedDiff = (time - lastTime) / (nextTime - lastTime)
        return @interpolate @value[lastTime], @value[nextTime], normedDiff
      else
        return @value[lastTime]

  reset: ->
    @value = { 0: @initialValue }

`})`
