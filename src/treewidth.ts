import Graph, { Vertex, Edge } from "./graph";

/*
function treewidthUpdateBounds() {
  const button = (<HTMLButtonElement>document.getElementById("treewidth"));
  button.value = `Treewidth: ${treewidthLowerBound}-${treewidthUpperBound}`;
}
*/

import { ImprovingAlgorithm } from "./algorithm";
export default class implements ImprovingAlgorithm {

  private g: Graph<Vertex, Edge>;
  private lowerBound: number;
  private upperBound: number;
  private request: any = null;
  private callback: (value: string) => void;

  public initialize(g: Graph<Vertex, Edge>, callback: (value: string) => void) {
    this.cancelRequest();
    this.g = g;
    this.g.on("changeGraphStructure", () => this.cancel());
    this.callback = callback;
    this.initializeBounds();
  }

  public run() {
    // compressIds is essential here because the treewidth server
    // expects that the set of vertices is of the form 0,1,...,n-1.
    this.g.compressIds();
    this.improveBound();
  }

  public cancel() {
    this.cancelRequest();
    this.initializeBounds();
  }

  private cancelRequest() {
    if(this.request) {
      this.request.abort();
      this.request = null;
    }
  }

  private initializeBounds() {
    this.lowerBound = 1;
    this.upperBound = this.g !== undefined ? Math.max(this.g.numberOfVertices() - 1, 1) : 999;
    this.sendUpdatedBounds();
  }

  private sendUpdatedBounds() {
    this.callback(`${this.lowerBound}-${this.upperBound}`);
  }

  private improveBound() {
    if(this.upperBound === this.lowerBound || this.request)
      return; // Nothing to improve or a request is already in flight.

    // Binary search: The server is going to tell us via AJAX if the
    // mid between upper and lower bound is a valid upper bound for
    // the treewidth.  We will update the lower/upper bounds
    // accordingly.
    const bound = Math.floor((this.upperBound + this.lowerBound) / 2);

    // Convert the graph into the format expected by the treewidth
    // server.
    let result = `${this.g.numberOfVertices()} ${this.g.numberOfEdges()} ${bound}\n`;
    for(const e of this.g.getEdges())
      result += `${e.tail} ${e.head}\n`;

    this.request = d3
      .text("/treewidth")
      .post(result, (error, text: string) => {
        this.request = null;
        if(!error) {
          if(text.startsWith("Treewidth is larger.")) {
            this.lowerBound = bound + 1;
          }
          else if(text.startsWith("Treewidth is smaller or equal.")) {
            this.upperBound = bound;
            // TODO: Parse and visualize the tree decomposition that the
            // server is kind enough to send.
          }
          else {
            // Abort because an error occurred and we don't want to
            // hammer the treewidth server.
            return;
          }
          this.sendUpdatedBounds();
          // Try to improve more.
          this.improveBound();
        }
      });
  }
};
