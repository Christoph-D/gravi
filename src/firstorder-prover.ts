import Graph, { Vertex, Edge } from "./graph";
import parser from "./firstorder-parser";
import ManagedPropertiesListenable from "managed-property";

// We declare the parameters of this algorithm in this way so that we
// can easily construct the corresponding input elements.
class FirstOrderParams extends ManagedPropertiesListenable {
  public formula: string;
}
FirstOrderParams.manageProperties({ name: "φ(x)", type: "string", defaultValue: "?y. E(x,y)" });

function solve(g: Graph<Vertex, Edge>, params: FirstOrderParams) {
  console.log(params.formula);
}

// TODO: The parameter instance needs the graph for the onChange
// handler.
import { ParameterizedAlgorithm } from "./algorithm";
export default <ParameterizedAlgorithm>{
  run: solve,
  makeParameters(): ManagedPropertiesListenable {
    return new FirstOrderParams({});
  },
};
