#= require Graph
#= require FiniteAutomaton
#= require SimpleGraph
#= require GraphEditor
#= require AlgorithmRunner
#= require <dfs.coffee>
#= require <generators.coffee>
#= require <examples.coffee>

# We need to add a new marker for every possible highlighting because
# marker elements do not inherit their css from the referencing
# element.
addHighlightedMarkers = ->
  template = document.getElementById("edgeArrow")
  defs = document.getElementById("graphDefinitions")
  for i in [1..2]
    t = template.cloneNode(true)
    t.id = "edgeArrowHighlight#{i}"
    t.setAttribute("class", "highlight#{i}")
    defs.appendChild(t)
addHighlightedMarkers()


state = {}
runAlgorithm = ->
  g = state.g
  d3.select("#loading-message").text("")
  try
    state.alg.run(g)
    state.slider.min(0).max(g.totalSteps - 1)
      .value(0)
      .axis(d3.svg.axis().ticks(g.totalSteps - 1))
    d3.select("#slider").call(state.slider)
  catch error
    d3.select("#loading-message").text(error.message)
  d3.select("body").on("keydown", () ->
    return unless document.activeElement.id != "dump"
    stopAnimation()
    newStep = state.editor.currentStep()
    switch d3.event.keyCode
      when 37 then --newStep if newStep >= 1
      when 39 then ++newStep if newStep <= state.editor.totalSteps() - 2
    state.editor.currentStep(newStep)
    state.slider.value(newStep)
    state.editor.draw())
  state.editor.draw()

generateGraph = ->
  stopAnimation()
  #state.g = graphFromJSON(s)
  state.g = generateRandomGraph(10, 0.2)
  #state.g = generatePath(10)
  if state.editor?
    state.editor.setGraph(state.g)
  else
    state.editor = new GraphEditor state.g, d3.select("#graph")
  unless state.slider?
    state.slider = d3.slider().on("slide", (event, value) ->
      stopAnimation()
      state.editor.currentStep(value)
      state.editor.draw()
    )
  runAlgorithm()

loadGraph = (json) ->
  stopAnimation()
  if not json?
    json = document.getElementById("dump").value
  d3.select("#loading-message").text("")
  try
    state.g = graphFromJSON(json)
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
        state.editor.draw()
        return ""

state.alg = new AlgorithmRunner(dfs)

d3.select("#run").on("click", animateAlgorithm)
d3.select("#generate").on("click", generateGraph)
d3.select("#save").on("click", saveGraph)
d3.select("#load").on("click", loadGraph)
d3.select("#example1").on("click", -> loadGraph example1)
generateGraph()
loadGraph example1
