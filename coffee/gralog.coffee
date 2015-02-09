#= require Graph
#= require <dfs.coffee>

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

g = graphFromJSON(s)
g.saveStep()
g.draw(d3.select("#graph"))
dfs(g)
d3.select("#slider").call(d3.slider().min(0).max(g.steps.length - 1).step(1)
  .on("slide", (event, value) ->
    g.steps[value].draw(d3.select("#graph")))
)
