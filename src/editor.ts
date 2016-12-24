import Graph, { Edge, Vertex, VertexOrEdge } from "./graph";
import "./historygraph";
import { GraphView, makeView } from "./graphview";
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
  private readonly svg;
  private alg: AlgorithmRunner;
  private slider: any;
  private animating: boolean;

  private readonly dfs = new AlgorithmRunner(dfsAlgo);
  private readonly parity = new AlgorithmRunner(solver);
  private readonly treewidth = new TreewidthImprover();
  private readonly layouter = new GraphLayouter();

  constructor() {
    d3.select("#load").on("click", () => {
      return this.loadGraph((<HTMLTextAreaElement>document.getElementById("dump")).value);
    });
    d3.select("#save").on("click", () => this.saveGraph());
    d3.select("#clear")
      .on("click", () => (<HTMLTextAreaElement>document.getElementById("dump")).value = "");
    d3.select("#example1").on("click", () => {
      (<HTMLTextAreaElement>document.getElementById("dump")).value =
        examples[0]; });

    const self = this;
    this.stopLayout();
    d3.select("#layout").on("change", () => this.runLayout());
    d3.select("#dfs").on("change", function() { return self.chooseAlgorithm((<any>this).value); });
    d3.select("#parity").on("change", function() { return self.chooseAlgorithm((<any>this).value); });

    d3.select("#run").on("click", () => this.animateAlgorithm());
    d3.select("#genClear").on("click", () => this.setGraph(new ParityGame()));
    d3.select("#genRandom").on("click", () => this.setGraph(generators.generateRandomGraph(15, 0.2)));
    d3.select("#genGrid").on("click", () => this.setGraph(generators.generateGrid()));
    d3.select("#load-save-choice").on("change", () => this.showHideLoadSaveBox());
    d3.select("#treewidth").on("click", () => this.treewidth.run());

    this.svg = d3.select("#graph");
    this.slider = (<any>d3).slider()
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
    const button = (<HTMLButtonElement>document.getElementById("treewidth"));
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
      if(document.activeElement.id === "dump")
        return;
      this.stopAnimation();
      let newStep = this.currentStep();
      switch((<KeyboardEvent>d3.event).keyCode) {
      case 37: // left arrow
        if(newStep >= 1)
          --newStep;
        break;
      case 39: // right arrow
        if(newStep <= this.totalSteps() - 2)
          ++newStep;
        break;
      case 46: // delete
        if(this.g.getVertices().indexOf(<Vertex>this.getSelection()) !== -1)
          this.g.removeVertex(<Vertex>this.getSelection());
        else if(this.g.getEdges().indexOf(<Edge>this.getSelection()) !== -1)
          this.g.removeEdge(<Edge>this.getSelection());
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
    (<HTMLTextAreaElement>document.getElementById("dump")).value =
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
      (<any>$("#run")).button("enable");
    }
    else {
      this.alg = this.parity;
      (<any>$("#run")).button("disable");

      // Hack to remove the cursor.
      // TODO: find the proper place for this.
      this.g.cursor.cursor.reset();
    }
    this.runAlgorithm();
  }

  private stopLayout() {
    this.layouter.cancel();
    (<any>$("#layout")).prop("checked", false).button("refresh");
  }
  private runLayout() {
    if((<HTMLInputElement>document.getElementById("layout")).checked)
      this.layouter.run();
    else
      this.layouter.cancel();
  }

  private showHideLoadSaveBox() {
    const f = d3.select("#load-save-form");
    if((<HTMLInputElement>document.getElementById("load-save-choice")).checked)
      f.style("display", "flex");
    else
      f.style("display", "none");
  }
}
