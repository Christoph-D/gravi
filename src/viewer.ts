import AlgorithmRunner from "./algorithmrunner";
import dfsAlgo from "./dfs";
import GraphEditor from "./editor";
import examples from "./examples";
import * as generators from "./generators";
import Graph, { Edge, Vertex } from "./graph";
import graphFromJSON from "./graphjson";
import GraphLayouter from "./layout";
import solver from "./paritygame-recursive";

function prepareGraph(g) {
  return g.on("changeGraphStructure", runAlgorithm);
}

const dfs = new AlgorithmRunner(dfsAlgo);
const parity = new AlgorithmRunner(solver);

interface State {
  g: Graph<Vertex, Edge>;
  alg: AlgorithmRunner;
  slider: any;
  editor: GraphEditor;
  animating: boolean;
}

function initialState(): State {
  const g = new Graph<Vertex, Edge>();
  const editor = new GraphEditor(g, d3.select("#graph"));
  const slider = (<any>d3).slider()
    .on("slide", function(event, value) {
      stopAnimation();
      editor.currentStep(value);
      editor.queueRedraw();
    });
  return {
    g,
    alg: parity,
    slider,
    editor,
    animating: false,
  };
}
const state: State = initialState();
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
    switch((<KeyboardEvent>d3.event).keyCode) {
    case 37: // left arrow
      if(newStep >= 1)
        --newStep;
      break;
    case 39: // right arrow
      if(newStep <= state.editor.totalSteps() - 2)
        ++newStep;
      break;
    case 46: // delete
      if(g.getVertices().indexOf(<Vertex>state.editor.selection) !== -1)
        g.removeVertex(<Vertex>state.editor.selection);
      else if(g.getEdges().indexOf(<Edge>state.editor.selection) !== -1)
        g.removeEdge(<Edge>state.editor.selection);
      break;
    default: break;
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
  state.editor.setGraph(state.g);
  runAlgorithm();
}

function loadGraph(json) {
  stopAnimation();
  if(json == null)
    json = (<HTMLTextAreaElement>document.getElementById("dump")).value;
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
  (<HTMLTextAreaElement>document.getElementById("dump")).value =
    JSON.stringify(state.g, undefined, 2);
}

function stopAnimation() {
  d3.select("#slider").transition().duration(0);
  state.animating = false;
  stopLayout();
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

function chooseAlgorithm() {
  if(this.value === "dfs") {
    state.alg = dfs;
    (<any>$("#run")).button("enable");
  }
  else {
    state.alg = parity;
    (<any>$("#run")).button("disable");

    // Hack to remove the cursor.
    // TODO: find the proper place for this.
    state.g.cursor.cursor.reset();
  }
  runAlgorithm();
}

let layoutDone = false;
function stopLayout() {
  layoutDone = true;
  (<any>$("#layout")).attr("checked", false).button("refresh");
}
function runLayout() {
  if((<HTMLInputElement>document.getElementById("layout")).checked) {
    layoutDone = false;
    const layouter = new GraphLayouter(state.g);
    let lastTime = null;
    const step: any = (timestamp) => {
      if(layoutDone)
        return;
      if(lastTime !== null)
        layouter.step(timestamp - lastTime);
      lastTime = timestamp;
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }
  else {
    stopLayout();
  }
}

function showHideLoadSaveBox() {
  const f = d3.select("#load-save-form");
  if((<HTMLInputElement>document.getElementById("load-save-choice")).checked)
    f.style("display", "flex");
  else
    f.style("display", "none");
}

d3.select("#load").on("click", loadGraph);
d3.select("#save").on("click", saveGraph);
d3.select("#clear")
  .on("click", () => (<HTMLTextAreaElement>document.getElementById("dump")).value = "");

d3.select("#layout").on("change", runLayout);
d3.select("#dfs").on("change", chooseAlgorithm);
d3.select("#parity").on("change", chooseAlgorithm);

d3.select("#run").on("click", animateAlgorithm);
d3.select("#generate").on("click", generateGraph);
d3.select("#load-save-choice").on("change", showHideLoadSaveBox);
d3.select("#example1").on("click", () => loadGraph(examples[0]));
generateGraph();
loadGraph(examples[0]);

if(d3.select("#dfs").property("checked"))
  Reflect.apply(chooseAlgorithm, { value: "dfs" }, []);
