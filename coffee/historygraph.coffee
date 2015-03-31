G = require "./graph"
TimedProperty = require "./timed"

# Adds a global timeline to the graph.  Useful in combination with
# TimedProperty on the vertices/edges.
G.Graph.injectDynamicProperty "history", class
  constructor: (@graph) ->
    @totalSteps = 0
    @currentStep = 0

  saveStep: ->
    ++@totalSteps
    ++@currentStep
    @

  clear: ->
    # Reset all timed properties to their default value.
    for v in @graph.getVertices()
      for key, value of v when value instanceof TimedProperty
        value.reset()
    for e in @graph.getEdges()
      for key, value of e when value instanceof TimedProperty
        value.reset()
    @totalSteps = 0
    @currentStep = 0
    @

# Marks a vertex in the graph.  Useful to show the state of
# depth-first search and related algorithms.
G.Graph.injectDynamicProperty "cursor", class
  constructor: (@graph) ->
    @cursor = new TimedProperty null, ["x", "y"]
  set: (cursor) ->
    @cursor.valueAtTime(@graph.history.currentStep, cursor)
  get: ->
    @cursor.valueAtTime(@graph.history.currentStep)

# Mixin to make a vertex or an edge highlightable.
class HighlightableMixin
  constructor: ->
    @highlightClass = new TimedProperty ""

  highlight: (highlightId) ->
    if highlightId?
      c = "highlight#{highlightId}"
    else
      c = ""
    @highlightClass.valueAtTime(@graph.history.currentStep, c)
    @

  getHighlightClass: ->
    @highlightClass.valueAtTime(@graph.history.currentStep)

G.Vertex.mixin HighlightableMixin
G.Edge.mixin HighlightableMixin

return G
