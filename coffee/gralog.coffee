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

#g = graphFromJSON(s)
#g = generateRandomGraph(10, 0.2)
g = generatePath(10)
editor = new GraphEditor g, d3.select("#graph")

slider = d3.slider().on("slide", (event, value) ->
  g.currentStep = value
  editor.draw())

runAlgorithm = ->
  g.clearHistory()
  g.saveStep()
  dfs(g)
  g.currentStep = 0
  slider.min(0).max(g.totalSteps - 1).step(1)
    .value(0)
    .axis(d3.svg.axis().ticks(g.totalSteps - 1))
  d3.select("#slider").call(slider)
  d3.select("body").on("keydown", () ->
    switch d3.event.keyCode
      when 37 then --g.currentStep if g.currentStep > 0
      when 39 then ++g.currentStep if g.currentStep < g.totalSteps - 1
    slider.value(g.currentStep)
    editor.draw())
  editor.draw()

d3.select("#run").on("click", runAlgorithm)
runAlgorithm()
