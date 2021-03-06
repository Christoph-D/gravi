import * as d3 from "d3";
import slider from "d3.slider";

import Graph, { Edge, Vertex, VertexOrEdge } from "./graph";
import "./historygraph";
import { GraphView, makeView, SVGSelection } from "./graphview";
import BasicAlgorithmRunner from "./basic-algorithmrunner";
import AlgorithmRunner from "./algorithmrunner";
import dfsAlgo from "./dfs";
import examples from "./examples";
import * as generators from "./generators";
import graphFromJSON from "./graphjson";
import GraphLayouter from "./layout";
import ParityGame from "./paritygame";
import solver from "./paritygame-recursive";
import TreewidthImprover from "./treewidth";

export default class GraphEditor {
  private g: Graph<Vertex, Edge>;
  private view: GraphView<Vertex, Edge>;
  private readonly svg: SVGSelection;
  private alg: BasicAlgorithmRunner;
  private slider: any;
  private animating: boolean;

  private readonly dfs = new AlgorithmRunner(dfsAlgo);
  private readonly parity = new AlgorithmRunner(solver);
  private readonly treewidth = new TreewidthImprover();
  private readonly layouter = new GraphLayouter();

  constructor() {
    d3.select("#load").on("click", () => {
      return this.loadGraph((document.getElementById("dump") as HTMLTextAreaElement).value);
    });
    d3.select("#save").on("click", () => this.saveGraph());
    d3.select("#clear")
      .on("click", () => (document.getElementById("dump") as HTMLTextAreaElement).value = "");
    d3.select("#example1").on("click", () => {
      (document.getElementById("dump") as HTMLTextAreaElement).value =
        examples[0]; });

    const self = this;
    this.stopLayout();
    d3.select("#layout").on("change", () => this.runLayout());
    d3.select<HTMLInputElement, {}>("#dfs")
      .on("change", function() { return self.chooseAlgorithm(this.value); });
    d3.select<HTMLInputElement, {}>("#parity")
      .on("change", function() { return self.chooseAlgorithm(this.value); });

    d3.select("#run").on("click", () => this.animateAlgorithm());
    d3.select("#genClear").on("click", () => this.setGraph(new ParityGame()));
    d3.select("#genRandom").on("click", () => this.setGraph(generators.generateRandomGraph(15, 0.2)));
    d3.select("#genGrid").on("click", () => this.setGraph(generators.generateGrid()));
    d3.select("#load-save-choice").on("change", () => this.showHideLoadSaveBox());
    d3.select("#treewidth").on("click", () => this.treewidth.run());

    this.svg = d3.select<SVGSVGElement, {}>("#graph");
    if(!(this.svg.node() instanceof SVGSVGElement))
      throw Error("Cannot find svg element.");

    this.slider = slider()
      .on("slide", (event, value) => {
        this.stopAnimation();
        this.currentStep(value);
        this.queueRedraw();
      });
    this.alg = this.parity;

    this.loadGraph(examples[0]);

    if(d3.select("#dfs").property("checked"))
      this.chooseAlgorithm("dfs");
  }

  public queueRedraw() {
    this.view.queueRedraw();
  }

  public getSelection(): VertexOrEdge {
    return this.view.selection;
  }

  public totalSteps() {
    return this.g.history.totalSteps;
  }

  public currentStep(step?: number): number {
    if(step == null)
      return this.g.history.currentStep;
    // If the current step changes, every vertex and edge could change
    // their highlight.
    if(step !== this.g.history.currentStep) {
      this.g.getVertices().map(v => v.modified = true);
      this.g.getEdges().map(e => e.modified = true);
    }
    this.g.history.currentStep = step;
    return step;
  }

  private prepareGraph(g) {
    return g
      .on("changeGraphStructure", () => this.runAlgorithm())
      .on("changePlayer", () => this.runAlgorithm())
      .on("changePriority", () => this.runAlgorithm());
  }

  private updateTreewidthBounds(value: string) {
    const button = document.getElementById("treewidth") as HTMLButtonElement;
    button.value = `Treewidth: ${value}`;
  }

  private runAlgorithm() {
    d3.select("#loading-message").text("");
    try {
      this.alg.run(this.g);
      const axisScale = d3.scaleLinear()
        .domain([0, this.totalSteps() - 1])
        .range([0, this.totalSteps() - 1]);
      this.slider.min(0).max(this.totalSteps() - 1)
        .value(0)
        .axis(d3.axisBottom(axisScale).ticks(this.totalSteps() - 1));
      d3.select("#slider").call(this.slider);
    }
    catch(error) {
      d3.select("#loading-message").text(error.message);
    }
    d3.select("body").on("keydown", () => {
      if(document.activeElement?.id === "dump")
        return;
      this.stopAnimation();
      let newStep = this.currentStep();
      switch((d3.event as KeyboardEvent).keyCode) {
      case 37: // left arrow
        if(newStep >= 1)
          --newStep;
        break;
      case 39: // right arrow
        if(newStep <= this.totalSteps() - 2)
          ++newStep;
        break;
      case 46: // delete
        if(this.g.getVertices().indexOf(this.getSelection() as Vertex) !== -1)
          this.g.removeVertex(this.getSelection() as Vertex);
        else if(this.g.getEdges().indexOf(this.getSelection() as Edge) !== -1)
          this.g.removeEdge(this.getSelection() as Edge);
        break;
      default: break;
      }
      this.currentStep(newStep);
      this.slider.value(newStep);
      this.queueRedraw();
    });
    this.queueRedraw();
  }

  private setGraph(g: Graph<Vertex, Edge>) {
    this.stopAnimation();
    this.g = this.prepareGraph(g);
    this.view = makeView(g, this.svg);
    this.treewidth.initialize(this.g, (s) => this.updateTreewidthBounds(s));
    this.layouter.initialize(this.g);
    this.runAlgorithm();
  }

  private loadGraph(json: string) {
    d3.select("#loading-message").text("");
    try {
      const g = graphFromJSON(json);
      g.compressIds();
      this.setGraph(g);
    }
    catch(e) {
      d3.select("#loading-message").text(`${e.name}: ${e.message}.`);
    }
  }

  private saveGraph() {
    this.g.compressIds();
    (document.getElementById("dump") as HTMLTextAreaElement).value =
      JSON.stringify(this.g, undefined, 2);
  }

  private stopAnimation() {
    d3.select("#slider").transition().duration(0);
    this.animating = false;
  }

  private animateAlgorithm() {
    this.runAlgorithm();
    this.animating = true;
    d3.select("#slider").transition().duration(this.slider.max() * 500)
      .ease(d3.easeLinear)
      .tween("dummy-name", () => {
        return (t) => {
          if(!this.animating)
            return "";
          this.slider.value(this.slider.max() * t);
          this.currentStep(this.slider.value());
          this.queueRedraw();
          return "";
        };
      });
  }

  private chooseAlgorithm(choice: string) {
    if(choice === "dfs") {
      this.alg = this.dfs;
      d3.select<HTMLInputElement, {}>("#run").property("disabled", false);
    }
    else {
      this.alg = this.parity;
      d3.select<HTMLInputElement, {}>("#run").property("disabled", true);

      // Hack to remove the cursor.
      // TODO: find the proper place for this.
      this.g.cursor.cursor.reset();
    }
    this.runAlgorithm();
  }

  private stopLayout() {
    this.layouter.cancel();
    d3.select<HTMLInputElement, {}>("#layout").property("checked", false);
  }
  private runLayout() {
    if((document.getElementById("layout") as HTMLInputElement).checked)
      this.layouter.run();
    else
      this.layouter.cancel();
  }

  private showHideLoadSaveBox() {
    const f = d3.select("#load-save-form");
    if((document.getElementById("load-save-choice") as HTMLInputElement).checked)
      f.style("display", "flex");
    else
      f.style("display", "none");
  }
}
