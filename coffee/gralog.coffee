#= require Graph
#= require GraphEditor
#= require <dfs.coffee>
#= require <generators.coffee>

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

s = '{
  "vertices": [
    {
      "outE": [
        0
      ],
      "inE": [],
      "id": 0,
      "x": 405,
      "y": 182
    },
    {
      "outE": [
        1
      ],
      "inE": [
        0
      ],
      "id": 1,
      "x": 110,
      "y": 27
    },
    {
      "outE": [],
      "inE": [
        1
      ],
      "id": 2,
      "x": 484,
      "y": 81
    }
  ],
  "edges": [
    {
      "tail": 0,
      "head": 1,
      "id": 0
    },
    {
      "tail": 1,
      "head": 2,
      "id": 1
    }
  ]
}'

state = {}
runAlgorithm = ->
  g = state.g
  g.clearHistory()
  g.saveStep()
  dfs(g)
  g.currentStep = 0
  state.slider.min(0).max(g.totalSteps - 1).step(1)
    .value(0)
    .axis(d3.svg.axis().ticks(g.totalSteps - 1))
  d3.select("#slider").call(state.slider)
  d3.select("body").on("keydown", () ->
    switch d3.event.keyCode
      when 37 then --g.currentStep if g.currentStep > 0
      when 39 then ++g.currentStep if g.currentStep < g.totalSteps - 1
    state.slider.value(g.currentStep)
    state.editor.draw())
  state.editor.draw()

generateGraph = ->
  #state.g = graphFromJSON(s)
  state.g = generateRandomGraph(10, 0.2)
  #state.g = generatePath(10)
  if state.editor?
    state.editor.setGraph(state.g)
  else
    state.editor = new GraphEditor state.g, d3.select("#graph")
  unless state.slider?
    state.slider = d3.slider().on("slide", (event, value) ->
      state.g.currentStep = value
      state.editor.draw()
    )
  runAlgorithm()

d3.select("#run").on("click", runAlgorithm)
d3.select("#generate").on("click", generateGraph)
generateGraph()
#slider = d3.slider().min(0).max(10).step(1)
#  .value(0)
#  .axis(d3.svg.axis().ticks(10))
#d3.select("#slider").call(slider)
#slider.min(0).max(2).step(1)
#  .value(0)
#  .axis(d3.svg.axis().ticks(2))
#d3.select("#slider").call(slider)
