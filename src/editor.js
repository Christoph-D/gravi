import { circleEdgeAnchor } from "./simplegraph";
import "./historygraph";

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
  for(let i of [1,2]) {
    newMarker()
      .attr("id", `edgeArrowHighlight${i}`)
      .attr("class", `highlight${i}`);
  }
}

export default class GraphEditor {
  constructor(g, svg) {
    this.svg = svg;
    // The current mouse position.
    this.mouse = { x: 0, y: 0 };

    this.svg.selectAll("*").remove();
    addHighlightedMarkers(this.svg);
    // Append the vertices after the edges or the click targets of
    // edges would obscure the vertices.
    this.svg.append("g").attr("id", "edges");
    this.svg.append("g").attr("id", "vertices");

    // The drag behavior for the vertices.
    let isLeftClickDrag = false;
    this.drag = d3.behavior.drag()
      .on("dragstart", (d) => {
        isLeftClickDrag = d3.event.sourceEvent.which === 1;
        if(!isLeftClickDrag)
          return;
        this.select(d);
        this.queueRedraw();
      })
      .on("drag", (d) => {
        // No dragging except on left clicks.
        if(!isLeftClickDrag)
          return;
        // Update the vertex position.
        d.x = d3.event.x;
        d.y = d3.event.y;
        // Invalidate the incident edges because the vertex moved.
        d.markIncidentEdgesModified();
        this.queueRedraw();
      });

    // Selecting and right clicks.
    this.svg.on("contextmenu", () => d3.event.preventDefault());
    this.svg.on("mousedown", () => {
      switch(d3.event.button) {
      case 0: // left click
        // Deselect everything.
        this.select(null);
        this.drawEdgeMode = false;
        break;
      case 2: // right click
        // Create new vertices on right click.
        d3.event.stopPropagation();
        d3.event.preventDefault();
        const v = new this.g.VertexType({ x: this.mouse.x, y: this.mouse.y });
        this.g.addVertex(v);
        if(this.drawEdgeMode) {
          const e = new this.g.EdgeType({ tail: this.selection.id, head: v.id });
          this.g.addEdge(e);
          this.drawEdgeMode = false;
        }
        this.queueRedraw();
        break;
      }
    });

    // Global mousemove handler to keep track of the mouse.
    const editor = this;
    this.svg.on("mousemove", function() {
      [editor.mouse.x, editor.mouse.y] = d3.mouse(this);
      if(editor.drawEdgeMode)
        editor.drawPointer();
    });

    this.setGraph(g);
  }

  // Sets the underlying graph of this editor instance.
  setGraph(g) {
    if(this.g === g)
      return;
    this.g = g;
    // This is true when the user is drawing a new edge.
    this.drawEdgeMode = false;
    this.select(null);
    this.g.VertexType.removeStaticListeners("redrawNeeded");
    this.g.VertexType.onStatic("redrawNeeded", () => this.queueRedraw());
    this.g.EdgeType.removeStaticListeners("redrawNeeded");
    this.g.EdgeType.onStatic("redrawNeeded", () => this.queueRedraw());

    // Rid the svg of previous clutter (keep the <defs>).
    this.svg.selectAll("#vertices > *").remove();
    this.svg.selectAll("#edges > *").remove();
  }

  select(vertexOrEdge) {
    // Mark the previous selection as modified so that we redraw it
    // without the selection marker.
    if(this.selection != null)
      this.selection.modified = true;
    this.selection = vertexOrEdge;
    if(this.selection != null)
      this.selection.modified = true;
  }

  totalSteps() {
    return this.g.history.totalSteps;
  }
  currentStep(step) {
    if(arguments.length === 0)
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

  onDoubleClickVertex(d) {
    d3.event.stopPropagation();
    this.select(d);
    this.drawEdgeMode = true;
    this.queueRedraw();
  }
  onMouseDownVertex(d) {
    switch(d3.event.button) {
    case 0: // left click
      // Stop the propagation or the click would propagate to the root
      // svg, deselecting everything.
      d3.event.stopPropagation();
      // No need to select this vertex because the "dragstart" event does
      // it, saving one redraw.
      break;
    case 2: // right click
      d3.event.stopPropagation();
      d3.event.preventDefault();
      this.drawEdgeMode = false;
      this.g.removeVertex(d);
      this.g.compressIds();
      this.queueRedraw();
      break;
    }
  }
  onMouseOverVertex(d) {
    if(this.drawEdgeMode && this.selection !== d) {
      const e = new this.g.EdgeType({ tail: this.selection.id, head: d.id });
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
  drawVertices() {
    const vertices = this.svg.select("#vertices").selectAll(".vertex").data(this.g.getVertices());
    const editor = this;
    // For each new vertex, add a <g> element to the svg, call
    // drawEnter() and install the handlers.
    vertices.enter().append("g")
      .each(function(v) { v.drawEnter(editor, d3.select(this)); })
      .call(this.drag)
      .on("dblclick", () => this.onDoubleClickVertex())
      .on("mousedown", () => this.onMouseDownVertex())
      .on("contextmenu", () => d3.event.preventDefault())
      .on("mouseover", () => this.onMouseOverVertex());
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
        d3.selectAll("#info *").remove();
        this.selection.appendPropertiesToDom(d3.select("#info"));
      }
    }
    else if(this.oldSelection !== this.selection) {
      d3.selectAll("#info *").remove();
      //d3.select("#info2").text("");
    }
    this.oldSelection = this.selection;
  }

  drawCursor() {
    if(this.g.cursor.get() === null) {
      this.svg.selectAll("#cursor").data([]).exit().remove();
      return;
    }
    const cursor = this.svg.selectAll("#cursor").data([this.g.cursor.get()]);
    cursor.enter().append("circle").attr("id", "cursor")
      .attr("r", "5")
      // Make the cursor transparent to mouse clicks.
      .style("pointer-events", "none");
    cursor
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);
  }

  onMouseDownEdge(d) {
    switch(d3.event.button) {
    case 0: // left click
      d3.event.stopPropagation();
      this.select(d);
      break;
    case 2: // right click
      d3.event.stopPropagation();
      d3.event.preventDefault();
      this.drawEdgeMode = false;
      this.g.removeEdge(d);
      this.g.compressIds();
      break;
    }
    this.queueRedraw();
  }

  drawEdges() {
    const edges = this.svg.select("#edges").selectAll(".edge").data(this.g.getEdges());
    const editor = this;
    edges.enter().append("g")
      .each(function (e) { e.drawEnter(editor, d3.select(this)); })
      .on("contextmenu", () => d3.event.preventDefault())
      .on("mousedown", () => this.onMouseDownEdge);
    edges.exit().remove();
    edges.each(function(e) {
      if(e.modified) {
        e.drawUpdate(editor, d3.select(this));
        e.modified = false;
      }
    });
    return this;
  }

  drawPointer() {
    // Draw an edge from the selected node to the mouse cursor.
    if(this.drawEdgeMode) {
      const pointer = this.svg.selectAll("#pointer").data([null]);
      pointer.enter().append("line").attr("id", "pointer").attr("class", "edge");
      const edgeAnchorS = this.selection.edgeAnchor(this.mouse);
      const edgeAnchorT = circleEdgeAnchor(this.mouse, this.selection, 7);
      pointer
        .attr("x1", edgeAnchorS.x)
        .attr("y1", edgeAnchorS.y)
        .attr("x2", edgeAnchorT.x)
        .attr("y2", edgeAnchorT.y);
    }
    else
      this.svg.selectAll("#pointer").remove();
    return this;
  }

  draw() {
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
    const median = this.times.slice().sort()[Math.floor(this.times.length / 2)];
    //d3.select("#performance").text("#{median} ms");
    return this;
  }

  queueRedraw() {
    if(this.redrawQueued)
      return;
    this.redrawQueued = true;
    window.requestAnimationFrame(() => this.draw());
  }
}
