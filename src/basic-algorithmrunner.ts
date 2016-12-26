import Graph, { Edge, Vertex } from "./graph";
import { AlgorithmRequirements } from "./algorithm";

abstract class BasicAlgorithmRunner {
  public run(graph: Graph<Vertex, Edge>) {
    const properties = graph.vertexPropertyDescriptors().map(p => p.name);
    const requirements = this.getRequirements();
    if(requirements.requiredProperties != null) {
      const missing: string[] = [];
      for(const p of requirements.requiredProperties)
        if(properties.indexOf(p) === -1)
          missing.push(p);
      if(missing.length > 0)
        throw Error(`Properties "${missing}" required by this algorithm do not exist in this graph.`);
    }
    graph.history.reset();
    if(requirements.checkPreConditions != null)
      requirements.checkPreConditions(graph);
    const result = this.runAlgorithm(graph);
    graph.history.currentStep = 0;
    return result;
  }

  protected abstract getRequirements(): AlgorithmRequirements;
  protected abstract runAlgorithm(graph: Graph<Vertex, Edge>);
}

export default BasicAlgorithmRunner;
