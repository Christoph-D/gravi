export default class AlgorithmRunner {
  constructor(algorithm) {
    this.algorithm = algorithm;
  }
  run(graph) {
    const properties = graph.VertexType.propertyDescriptors.map(p => p.name);
    if(this.algorithm.requiredProperties != null)
      for(let p of this.algorithm.requiredProperties)
        if(properties.indexOf(p) === -1)
          throw Error(`Property "${p}" required by this algorithm does not exist in this graph.`);
    graph.history.reset();
    if(this.algorithm.checkPreConditions != null)
      this.algorithm.checkPreConditions(graph);
    const result = this.algorithm(graph);
    graph.history.currentStep = 0;
    return result;
  }
}
