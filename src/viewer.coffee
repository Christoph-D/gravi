G = require "./gravi"
examples = require "./examples"
solver = require "./parityrecursive"

addVertexListener = (v) ->
  v.on("changePlayer", runAlgorithm)
  v.on("changePriority", runAlgorithm)

prepareGraph = (g) ->
  g.on("postAddEdge", runAlgorithm)
  g.on("postAddVertex", runAlgorithm)
  g.on("postAddVertex", addVertexListener)
  addVertexListener v for v in g.vertices
  g.on("postRemoveEdge", runAlgorithm)
  g.on("postRemoveVertex", runAlgorithm)
  g

state = {}
runAlgorithm = ->
  g = state.g
  d3.select("#loading-message").text("")
  try
    state.alg.run(g)
    state.slider.min(0).max(state.editor.totalSteps() - 1)
      .value(0)
      .axis(d3.svg.axis().ticks(state.editor.totalSteps() - 1))
    d3.select("#slider").call(state.slider)
  catch error
    d3.select("#loading-message").text(error.message)
  d3.select("body").on("keydown", () ->
    return if document.activeElement.id == "dump"
    stopAnimation()
    newStep = state.editor.currentStep()
    switch d3.event.keyCode
      when 37 # left arrow
        --newStep if newStep >= 1
      when 39 # right arrow
        ++newStep if newStep <= state.editor.totalSteps() - 2
      when 46 # delete
        if state.editor.selection in g.getVertices()
          g.removeVertex(state.editor.selection)
        else if state.editor.selection in g.getEdges()
          g.removeEdge(state.editor.selection)
    state.editor.currentStep(newStep)
    state.slider.value(newStep)
    state.editor.queueRedraw())
  state.editor.queueRedraw()

generateGraph = ->
  stopAnimation()
  #state.g = graphFromJSON(s)
  state.g = prepareGraph(G.generateRandomGraph(10, 0.2))
  #state.g = generatePath(10)
  if state.editor?
    state.editor.setGraph(state.g)
  else
    state.editor = new G.GraphEditor state.g, d3.select("#graph")
  unless state.slider?
    state.slider = d3.slider().on("slide", (event, value) ->
      stopAnimation()
      state.editor.currentStep(value)
      state.editor.queueRedraw()
    )
  runAlgorithm()

loadGraph = (json) ->
  stopAnimation()
  if not json?
    json = document.getElementById("dump").value
  d3.select("#loading-message").text("")
  try
    state.g = prepareGraph(G.graphFromJSON(json))
    state.g.compressIds()
    state.editor.setGraph(state.g)
    runAlgorithm()
  catch e
    d3.select("#loading-message").text("#{e.name}: #{e.message}.")

saveGraph = ->
  state.g.compressIds()
  document.getElementById("dump").value = JSON.stringify(state.g, undefined, 2)

stopAnimation = ->
  d3.select("#slider").transition().duration(0)
  state.animating = false

animateAlgorithm = ->
  runAlgorithm()
  state.animating = true
  d3.select("#slider").transition().duration(state.slider.max() * 500)
    .ease(d3.ease("linear"))
    .tween "dummy-name", ->
      (t) ->
        return "" unless state.animating
        state.slider.value(state.slider.max() * t)
        state.editor.currentStep(state.slider.value())
        state.editor.queueRedraw()
        return ""

#state.alg = new G.AlgorithmRunner(G.dfs.run)
state.alg = new G.AlgorithmRunner(solver.parityWin)

d3.select("#run").on("click", animateAlgorithm)
d3.select("#generate").on("click", generateGraph)
d3.select("#save").on("click", saveGraph)
d3.select("#load").on("click", loadGraph)
d3.select("#example1").on("click", -> loadGraph examples[0])
generateGraph()
loadGraph examples[0]
