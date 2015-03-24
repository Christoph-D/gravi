`define(function(require){`

G = require './graph'
TimedProperty = require './timed'

# Adds a global timeline to the graph.  Useful in combination with
# TimedProperty on the vertices/edges.
G.Graph.mixin class
  constructor: ->
    @totalSteps = 0
    @currentStep = 0

  saveStep: ->
    ++@totalSteps
    ++@currentStep
    @

  clearHistory: ->
    # Reset all timed properties to their default value.
    for v in @getVertices()
      for key, value of v when value instanceof TimedProperty
        value.reset()
    for e in @getEdges()
      for key, value of e when value instanceof TimedProperty
        value.reset()
    @totalSteps = 0
    @currentStep = 0
    @

# Marks a vertex in the graph.  Useful to show the state of
# depth-first search and related algorithms.
G.Graph.mixin class
  constructor: -> @cursor = new TimedProperty null, ["x", "y"]

  setCursor: (cursor) ->
    @cursor.valueAtTime(@currentStep, cursor)
    @

  getCursor: -> @cursor.valueAtTime(@currentStep)

# Mixin to make a vertex or an edge highlightable.
class HighlightableMixin
  constructor: ->
    @highlightClass = new TimedProperty ""

  highlight: (highlightId) ->
    if highlightId?
      c = "highlight#{highlightId}"
    else
      c = ""
    @highlightClass.valueAtTime(@graph.currentStep, c)
    @

  getHighlightClass: ->
    @highlightClass.valueAtTime(@graph.currentStep)

G.Vertex.mixin HighlightableMixin
G.Edge.mixin HighlightableMixin

return G

`})`
