G = require "./graph"
TimedProperty = require "./timed"

# Adds a global timeline to the graph.  Useful in combination with
# TimedProperty on the vertices/edges.
G.Graph.injectDelayedProperty "history", class
  constructor: (@graph) ->
    @totalSteps = 0
    @currentStep = 0

  saveStep: ->
    ++@totalSteps
    ++@currentStep
    @

  reset: ->
    # Blindly reset all properties.
    for v in @graph.getVertices()
      for key, value of v
        try
          value.reset()
        catch
      v.modified = true
    for e in @graph.getEdges()
      for key, value of e
        try
          value.reset()
        catch
      e.modified = true
    @totalSteps = 0
    @currentStep = 0
    @

# Marks a vertex in the graph.  Useful to show the state of
# depth-first search and related algorithms.
G.Graph.injectDelayedProperty "cursor", class
  constructor: (@graph) ->
    @cursor = new TimedProperty null, ["x", "y"]
  set: (cursor) ->
    @cursor.valueAtTime(@graph.history.currentStep, cursor)
  get: ->
    @cursor.valueAtTime(@graph.history.currentStep)

# Makes a vertex or an edge highlightable.
class Highlight
  constructor: (@parent) ->
    @highlightClass = new TimedProperty ""

  set: (highlightId) ->
    if highlightId?
      c = "highlight#{highlightId}"
    else
      c = ""
    @highlightClass.valueAtTime(@parent.graph.history.currentStep, c)
    @

  getCSSClass: ->
    @highlightClass.valueAtTime(@parent.graph.history.currentStep)

  reset: -> @highlightClass.reset()

G.Vertex.injectDelayedProperty "highlight", Highlight
G.Edge.injectDelayedProperty "highlight", Highlight
return G
