import Graph, { Edge, Vertex } from "./graph";
import ManagedPropertiesListenable from "managed-property";

// Methods to check the requirements of an algorithm.
export interface AlgorithmRequirements {
  requiredProperties?: string[];
  checkPreConditions?: (g: Graph<Vertex, Edge>) => boolean;
};

// A one-shot algorithm returning a result.  Example: Computing a
// spanning tree.
export interface Algorithm extends AlgorithmRequirements {
  run(g: Graph<Vertex, Edge>): any;
};

export interface ParameterizedAlgorithm extends AlgorithmRequirements {
  run(g: Graph<Vertex, Edge>, parameters: ManagedPropertiesListenable): any;
  // Instantiate a new parameter.
  makeParameters(): ManagedPropertiesListenable;
};

// An algorithm that cannot complete immediately but needs several
// iterations.  Example: Iteratively approximating the treewidth via
// AJAX calls.
export interface ImprovingAlgorithm extends AlgorithmRequirements {
  // Initialize this algorithm with the given graph.  You must call
  // this method before calling any other method.  The provided
  // callback function will be called zero or more times with the
  // current algorithm result.  The callback function may be called
  // before calling run() to provide default values.
  initialize(g: Graph<Vertex, Edge>, callback: (value: string) => void): void;

  // Improve the attributes computed by this algorithm.  For example,
  // this may issue an AJAX request.  run() must return immediately.
  run(): void;

  // Cancel all running AJAX requests etc.
  cancel(): void;
};
