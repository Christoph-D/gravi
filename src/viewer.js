/*global d3*/
/*eslint-env browser, jquery*/
import * as generators from "./generators";
import dfsAlgo from "./dfs";
import examples from "./examples";
import solver from "./paritygame-recursive";
import AlgorithmRunner from "./algorithmrunner";
import graphFromJSON from "./graphjson";
import GraphEditor from "./editor";

function addVertexListener(v) {
  v.on("changePlayer", runAlgorithm);
  v.on("changePriority", runAlgorithm);
}

function prepareGraph(g) {
  g.on("postAddEdge", runAlgorithm);
  g.on("postAddVertex", runAlgorithm);
  g.on("postAddVertex", addVertexListener);
  g.vertices.map(v => addVertexListener(v));
  g.on("postRemoveEdge", runAlgorithm);
  g.on("postRemoveVertex", runAlgorithm);
  return g;
}

const state = {};
function runAlgorithm() {
  const g = state.g;
  d3.select("#loading-message").text("");
  try {
    state.alg.run(g);
    state.slider.min(0).max(state.editor.totalSteps() - 1)
      .value(0)
      .axis(d3.svg.axis().ticks(state.editor.totalSteps() - 1));
    d3.select("#slider").call(state.slider);
  }
  catch(error) {
    d3.select("#loading-message").text(error.message);
  }
  d3.select("body").on("keydown", function() {
    if(document.activeElement.id === "dump")
      return;
    stopAnimation();
    let newStep = state.editor.currentStep();
    switch(d3.event.keyCode) {
    case 37: // left arrow
      if(newStep >= 1)
        --newStep;
      break;
    case 39: // right arrow
      if(newStep <= state.editor.totalSteps() - 2)
        ++newStep;
      break;
    case 46: // delete
      if(g.getVertices().indexOf(state.editor.selection) !== -1)
        g.removeVertex(state.editor.selection);
      else if(g.getEdges().indexOf(state.editor.selection) !== -1)
        g.removeEdge(state.editor.selection);
      break;
    }
    state.editor.currentStep(newStep);
    state.slider.value(newStep);
    state.editor.queueRedraw();
  });
  state.editor.queueRedraw();
}

function generateGraph() {
  stopAnimation();
  //state.g = graphFromJSON(s);
  state.g = prepareGraph(generators.generateRandomGraph(15, 0.2));
  //state.g = generators.generatePath(10);
  if(state.editor != null)
    state.editor.setGraph(state.g);
  else {
    state.editor = new GraphEditor(state.g, d3.select("#graph"));
    if(state.slider == null) {
      state.slider = d3.slider()
        .on("slide", function(event, value) {
          stopAnimation();
          state.editor.currentStep(value);
          state.editor.queueRedraw();
        });
    }
  }
  runAlgorithm();
}

function loadGraph(json) {
  stopAnimation();
  if(json == null)
    json = document.getElementById("dump").value;
  d3.select("#loading-message").text("");
  try {
    state.g = prepareGraph(graphFromJSON(json));
    state.g.compressIds();
    state.editor.setGraph(state.g);
    runAlgorithm();
  }
  catch(e) {
    d3.select("#loading-message").text(`${e.name}: ${e.message}.`);
  }
}

function saveGraph() {
  state.g.compressIds();
  document.getElementById("dump").value = JSON.stringify(state.g, undefined, 2);
}

function stopAnimation() {
  d3.select("#slider").transition().duration(0);
  state.animating = false;
}

function animateAlgorithm() {
  runAlgorithm();
  state.animating = true;
  d3.select("#slider").transition().duration(state.slider.max() * 500)
    .ease(d3.ease("linear"))
    .tween("dummy-name", function() {
      return function(t) {
        if(!state.animating)
          return "";
        state.slider.value(state.slider.max() * t);
        state.editor.currentStep(state.slider.value());
        state.editor.queueRedraw();
        return "";
      };
    });
}

const dfs = new AlgorithmRunner(dfsAlgo);
const parity = new AlgorithmRunner(solver);
state.alg = parity;

function chooseAlgorithm() {
  if(this.value === "dfs") {
    state.alg = dfs;
    $("#run").button("enable");
  }
  else {
    state.alg = parity;
    $("#run").button("disable");

    // Hack to remove the cursor.
    // TODO: find the proper place for this.
    state.g.cursor.cursor.reset();
  }
  runAlgorithm();
}

d3.select("#dfs").on("change", chooseAlgorithm);
d3.select("#parity").on("change", chooseAlgorithm);

d3.select("#run").on("click", animateAlgorithm);
d3.select("#generate").on("click", generateGraph);
d3.select("#save").on("click", saveGraph);
d3.select("#load").on("click", loadGraph);
d3.select("#example1").on("click", () => loadGraph(examples[0]));
generateGraph();
loadGraph(examples[0]);

if(d3.select("#dfs").property("checked"))
  Reflect.apply(chooseAlgorithm, { value: "dfs" }, []);
