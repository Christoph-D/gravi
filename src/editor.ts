import Graph, { Edge, Vertex, VertexOrEdge } from "./graph";
import "./historygraph";
import { VertexDrawableDefault, circleEdgeAnchor } from "./simplegraph";

// A GraphEditor expects vertices and edges to offer the methods
// drawEnter() and drawUpdate().  It calls drawEnter() once on every
// new vertex/edge and drawUpdate() every time a redraw is needed.

// Changing stroke-color etc. on edges does not affect the marker
// (the arrow head).  In order to affect the marker, we need
// different markers for each possible edge highlight.  Highlighting
// an edge then amounts to changing the css class of the edge, which
// selects the correct marker.
function addHighlightedMarkers(svg) {
  // Markers have to be defined once in <defs> in the svg.
  const defs = svg.append("defs");
  function newMarker() {
    const marker = defs
            .append("marker").attr("id", "edgeArrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", "2").attr("refY", "5")
            .attr("markerUnits", "userSpaceOnUse")
            .attr("markerWidth", "20").attr("markerHeight", "14")
            .attr("orient", "auto");
    // An arrow head.
    marker.append("path").attr("d", "M 0 0 L 10 5 L 0 10 z");
    return marker;
  }
  // Create one marker without highlights.
  newMarker();
  // Create markers for all possible edge highlights.
  for(const i of [1,2]) {
    newMarker()
      .attr("id", `edgeArrowHighlight${i}`)
      .attr("class", `highlight${i}`);
  }
}

export default class GraphEditor {
  public g: Graph<Vertex, Edge>;
  public selection: VertexOrEdge;
  private oldSelection: VertexOrEdge;
  private svg: any;
  private mouse: { x: number, y: number };
  private panLast: [number, number];
  private panHappening: boolean;
  private drawEdgeMode: boolean;
  private redrawQueued: boolean;
  private zoom: any;
  private graphGroup: any;
  private drag: any;
  private times: number[];

  constructor(g, svg) {
    this.svg = svg;
    // The current mouse position.
    this.mouse = { x: 0, y: 0 };

    this.svg.selectAll("*").remove();
    addHighlightedMarkers(this.svg);

    // We need to track manually if the user is panning the view.
    // This affects the "mouseup" handler on empty space: If the user
    // is panning, then we want to keep the selection active,
    // otherwise we want to deselect everything.  this.panLast saves
    // the last translation vector the "zoom" handler received.
    this.panLast = [NaN, NaN];
    this.panHappening = false;
    this.zoom = d3.zoom()
      .scaleExtent([0.25, 4])
      .on("start", () => { this.panHappening = false; })
      .on("zoom", () => this.onZoom())
      .on("end", () => {
        const e = <MouseEvent | null>d3.event.sourceEvent;
        if(e === null)
          return;
        if(e.button === 0 && !this.panHappening) {
          // Left click.  Deselect everything.
          this.select(null);
          this.drawEdgeMode = false;
          this.queueRedraw();
        }
      });
    this.svg.call(this.zoom);

    // Append the vertices after the edges or the click targets of
    // edges would obscure the vertices.
    this.graphGroup = this.svg.append("g").attr("id", "graphgroup");
    this.graphGroup.append("g").attr("id", "edges");
    this.graphGroup.append("g").attr("id", "vertices");

    // The drag behavior for the vertices.
    this.drag = d3.drag()
      .on("start", (d) => {
        this.select(d);
        this.queueRedraw();
      })
      .on("drag", (d: Vertex) => {
        const e = d3.event;
        // Update the vertex position.
        d.x = e.x;
        d.y = e.y;
        // Invalidate the incident edges because the vertex moved.
        d.markIncidentEdgesModified();
        this.queueRedraw();
      });

    // Clicks on empty space (left click deselects, right click
    // creates a vertex).
    this.svg.on("contextmenu", () => (<MouseEvent>d3.event).preventDefault());
    this.svg.on("mousedown", () => {
      const event = <MouseEvent>d3.event;
      if(event.button !== 2)
        return;
      // Create a new vertex on right click.
      event.stopPropagation();
      event.preventDefault();
      const v = this.g.addVertex({ x: this.mouse.x, y: this.mouse.y });
      if(this.drawEdgeMode) {
        this.g.addEdge({ head: v.id, tail: this.selection.id });
        this.drawEdgeMode = false;
      }
      this.queueRedraw();
    });

    // Global mousemove handler to keep track of the mouse.
    const self = this;
    this.svg.on("mousemove", function() {
      const transform = d3.zoomTransform(self.svg.node());
      [ self.mouse.x, self.mouse.y ] = transform.invert(d3.mouse(this));
      if(self.drawEdgeMode)
        self.drawPointer();
    });

    this.setGraph(g);
  }

  // Sets the underlying graph of this editor instance and establishes
  // itself as the only listener to the "redrawNeeded" event.
  public setGraph(g) {
    if(this.g === g)
      return;
    this.g = g;
    // This is true when the user is drawing a new edge.
    this.drawEdgeMode = false;
    this.select(null);
    this.g.removeListeners("redrawNeeded");
    this.g.on("redrawNeeded", () => this.queueRedraw());

    // Rid the svg of previous clutter (keep the <defs>).
    this.graphGroup.selectAll("#vertices > *").remove();
    this.graphGroup.selectAll("#edges > *").remove();

    this.recenter();
  }

  // Translate the view port so that the median vertex is centered.  x
  // and y are considered separately.  Also reset the scale factor to
  // 1.
  public recenter() {
    const median = (f: (v: Vertex) => number) => {
      const vertices = this.g.getVertices();
      if(vertices.length === 0)
        return 0;
      const positions = vertices.map(f).sort((a, b) => a - b);
      return positions[Math.floor(positions.length / 2)];
    };
    const x = -median(v => v.x);
    const y = -median(v => v.y);
    this.svg.call(this.zoom.transform, d3.zoomIdentity.translate(x, y).scale(1));
  }

  public select(vertexOrEdge) {
    // Mark the previous selection as modified so that we redraw it
    // without the selection marker.
    if(this.selection != null) {
      this.selection.modified = true;
      this.selection.selected = false;
    }
    this.selection = vertexOrEdge;
    if(this.selection != null) {
      this.selection.modified = true;
      this.selection.selected = true;
    }
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

  public queueRedraw() {
    if(this.redrawQueued)
      return;
    this.redrawQueued = true;
    window.requestAnimationFrame(() => this.draw());
  }

  private onZoom() {
    const e = d3.event;
    this.graphGroup
      .attr("transform",
            `translate(${e.transform.x}, ${e.transform.y})scale(${e.transform.k})`);
    if(this.panLast[0] !== e.transform.x ||
       this.panLast[1] !== e.transform.y) {
      this.panHappening = true;
    }
    this.panLast = [ e.transform.x, e.transform.y ];
  }

  private onDoubleClickVertex(d) {
    (<MouseEvent>d3.event).stopPropagation();
    this.select(d);
    this.drawEdgeMode = true;
    this.queueRedraw();
  }
  private onMouseDownVertex(d) {
    const e = <MouseEvent>d3.event;
    switch(e.button) {
    case 0:
      // Stop the propagation or the click would start panning of the
      // whole svg.
      e.stopPropagation();
      // No need to select this vertex because the "dragstart" event does
      // it, saving one redraw.
      break;
    case 2: // right click
      e.stopPropagation();
      e.preventDefault();
      this.drawEdgeMode = false;
      this.g.removeVertex(d);
      this.g.compressIds();
      this.queueRedraw();
      break;
    default: break;
    }
  }
  private onMouseUpKeepSelected() {
    const e = <MouseEvent>d3.event;
    if(e.button === 0) { // left click
      // We want to keep this vertex/edge selected after "mouseup".
      // So we prevent the usual "mouseup" handler from running
      // because it would deselect it.
      e.preventDefault();
      // Do not call d3.event.stopPropagation() because we want
      // "dragend" to fire.  Otherwise dragging would never end.
    }
  }
  private onMouseOverVertex(d) {
    if(this.drawEdgeMode && this.selection !== d) {
      const e = { head: (<Vertex>d).id, tail: this.selection.id };
      if(this.g.hasEdge(e)) {
        this.g.removeEdge(e);
        this.g.compressIds();
      }
      else {
        this.g.addEdge(e);
      }
      this.drawEdgeMode = false;
      this.queueRedraw();
    }
  }
  private drawVertices() {
    const vertexSelection = this.graphGroup.select("#vertices").selectAll(".vertex");
    const vertices = vertexSelection.data(this.g.getVertices(), (v: Vertex) => v.id);
    const editor = this;
    // For each new vertex, add a <g> element to the svg, call
    // drawEnter() and install the handlers.
    vertices.enter().append("g")
      .each(function(v) { v.drawEnter(editor, d3.select(this));
                          v.drawUpdate(editor, d3.select(this)); })
      .call(this.drag)
      .on("dblclick", (d) => this.onDoubleClickVertex(d))
      .on("mousedown", (d) => this.onMouseDownVertex(d))
      .on("mouseup", () => this.onMouseUpKeepSelected())
      .on("contextmenu", () => (<MouseEvent>d3.event).preventDefault())
      .on("mouseover", (d) => this.onMouseOverVertex(d));
    vertices.exit().remove();
    vertices.each(function(v) {
      if(v.modified)
        v.drawUpdate(editor, d3.select(this));
      v.modified = false;
    });

    this.drawCursor();

    if(this.selection != null) {
      //d3.select("#info2").text(JSON.stringify(G.vertexOrEdgeToJSON(this.selection), undefined, 2));
      if(this.oldSelection !== this.selection) {
        d3.select("#infocol").style("display", "block");
        d3.selectAll("#info *").remove();
        this.selection.appendPropertiesToDom(d3.select("#info"));
      }
    }
    else if(this.oldSelection !== this.selection) {
      d3.selectAll("#info *").remove();
      d3.select("#infocol").style("display", "none");
    }
    this.oldSelection = this.selection;
  }

  private drawCursor() {
    if(this.g.cursor.get() === null) {
      this.graphGroup.selectAll("#cursor").data([]).exit().remove();
      return;
    }
    const cursor = this.graphGroup.selectAll("#cursor").data([this.g.cursor.get()]);
    cursor.enter().append("circle").attr("id", "cursor")
      .attr("r", "5")
      // Make the cursor transparent to mouse clicks.
      .style("pointer-events", "none");
    cursor
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);
  }

  private onMouseDownEdge(d) {
    const e = <MouseEvent>d3.event;
    switch(e.button) {
    case 0: // left click
      e.stopPropagation();
      this.select(d);
      break;
    case 2: // right click
      e.stopPropagation();
      e.preventDefault();
      this.drawEdgeMode = false;
      this.g.removeEdge(d);
      this.g.compressIds();
      break;
    default: break;
    }
    this.queueRedraw();
  }
  private drawEdges() {
    const edges = this.graphGroup.select("#edges")
            .selectAll(".edge").data(this.g.getEdges());
    const editor = this;
    edges.enter().append("g")
      .each(function(e) { e.drawEnter(editor, d3.select(this));
                          e.drawUpdate(editor, d3.select(this)); })
      .on("contextmenu", () => (<MouseEvent>d3.event).preventDefault())
      .on("mousedown", (d) => this.onMouseDownEdge(d))
      .on("mouseup", () => this.onMouseUpKeepSelected());
    edges.exit().remove();
    edges.each(function(e) {
      if(e.modified) {
        e.drawUpdate(editor, d3.select(this));
        e.modified = false;
      }
    });
    return this;
  }

  private drawPointer() {
    // Draw an edge from the selected node to the mouse cursor.
    if(this.drawEdgeMode) {
      const pointer = this.graphGroup.selectAll("#pointer").data([null]);
      pointer.enter().append("line").attr("id", "pointer").attr("class", "edge");
      const edgeAnchorS = (<VertexDrawableDefault>this.selection).edgeAnchor(this.mouse);
      const edgeAnchorT = circleEdgeAnchor(this.mouse, this.selection, 7);
      pointer
        .attr("x1", edgeAnchorS.x)
        .attr("y1", edgeAnchorS.y)
        .attr("x2", edgeAnchorT.x)
        .attr("y2", edgeAnchorT.y);
    }
    else {
      this.graphGroup.selectAll("#pointer").remove();
    }
    return this;
  }

  private draw() {
    this.redrawQueued = false;
    if(this.times == null)
      this.times = [];

    const start = performance.now();
    this.drawEdges();
    const end = performance.now();
    this.drawPointer();
    this.drawVertices();

    this.times.push(end - start);
    if(this.times.length > 40)
      this.times.shift();
    //const median = this.times.slice().sort()[Math.floor(this.times.length / 2)];
    //d3.select("#performance").text("#{median} ms");
    return this;
  }
}
