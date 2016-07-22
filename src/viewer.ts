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
  return g
    .on("changeGraphStructure", runAlgorithm)
    .on("changeGraphStructure", cancelTreewidthRequest);
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
      .axis(d3.axisBottom().ticks(state.editor.totalSteps() - 1));
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
  cancelTreewidthRequest();
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
    cancelTreewidthRequest();
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
    .ease(d3.easeLinear)
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

let treewidthLowerBound = 1;
let treewidthUpperBound = 999;
let treewidthRequest: any = undefined;

function cancelTreewidthRequest() {
  if(treewidthRequest)
    treewidthRequest.abort();
  // Reset the bounds.
  treewidthLowerBound = 1;
  treewidthUpperBound = Math.max(state.g.getVertices().length - 1, 1);
  treewidthUpdateBounds();
}

function treewidthUpdateBounds() {
  const button = (<HTMLButtonElement>document.getElementById("treewidth"));
  button.value = `Treewidth: ${treewidthLowerBound}-${treewidthUpperBound}`;
}

function improveTreewidthBound() {
  if(treewidthUpperBound === treewidthLowerBound)
    return; // Nothing to improve

  const bound = Math.floor((treewidthUpperBound + treewidthLowerBound) / 2);

  // Convert the graph into the format expected by the treewidth
  // server.
  let result = `${state.g.vertices.length} ${state.g.edges.length} ${bound}\n`;
  for(const e of state.g.getEdges())
    result += `${e.tail} ${e.head}\n`;

  treewidthRequest = d3
    .text("/treewidth")
    .post(result, function(error, text: string) {
      treewidthRequest = undefined;
      if(!error) {
        if(text.startsWith("Treewidth is larger.")) {
          treewidthLowerBound = bound + 1;
        }
        else if(text.startsWith("Treewidth is smaller or equal.")) {
          treewidthUpperBound = bound;
          // TODO: Parse and visualize the tree decomposition that the
          // server is kind enough to send.
        }
        else {
          // Abort because an error occurred and we don't want to
          // hammer the treewidth server.
          return;
        }
        treewidthUpdateBounds();
        // Try to improve more.
        improveTreewidthBound();
      }
    });
}

function computeTreewidth() {
  // compressIds is essential here because the treewidth server
  // expects that the set of vertices is of the form 0,1,...,n-1.
  state.g.compressIds();
  improveTreewidthBound();
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
d3.select("#treewidth").on("click", computeTreewidth);

generateGraph();
loadGraph(examples[0]);

if(d3.select("#dfs").property("checked"))
  Reflect.apply(chooseAlgorithm, { value: "dfs" }, []);