import { ParityGameVertex } from "./paritygame";

// A play profile contains l, B, k.
export class PlayProfile {
  public l: number;
  public B: ParityGameVertex[];
  public k: number;

  constructor({ l, B, k }) {
    this.l = l;
    this.B = B;
    this.k = k;
  }
  public lessThanOrEqual(other: PlayProfile) {
    if(this.l !== other.l)
      return SI.rewardLess(this.l, other.l);
    else {
      const a = SI.maxDiffLessOrEqualL(this.B, other.B, this.l);
      const b = SI.maxDiffLessOrEqualL(other.B, this.B, this.l);
      if(!(a && b))
        // this.B and other.B are not this.l-equivalent
        return a && !b;
      else
        // this.B and other.B are this.l-equivalent
        if(this.l % 2 === 1)
          return this.k <= other.k;
        else
          return other.k <= this.k;
    }
  }
}

export const SI = {
  reward(v: ParityGameVertex | number) {
    const p = typeof v === "number" ? v : v.priority;
    if(p < 0)
      throw Error("A priority cannot be negative");
    return p % 2 === 0 ? p : -p;
  },
  rewardLessOrEqual(v, w) { return SI.reward(v) <= SI.reward(w); },
  rewardLess(v, w) { return SI.reward(v) < SI.reward(w); },
  maxDiffLessOrEqual(B: ParityGameVertex[], C: ParityGameVertex[]) {
    const B1 = B.map(v => v.priority);
    const C1 = C.map(v => v.priority);
    if(B1.length === C1.length) {
      let equal = true;
      for(let i = 0; i < B1.length; ++i)
        if(B1[i] !== C1[i])
          equal = false;
      if(equal)
        return true;
    }
    const B2 = B1.filter((v) => C1.indexOf(v) === -1);
    const C2 = C1.filter((v) => B1.indexOf(v) === -1);
    const d = Math.max(...B2.concat(C2));
    return (B2.indexOf(d) !== -1 && d % 2 === 1) || (C2.indexOf(d) !== -1 && d % 2 === 0);
  },
  maxDiffLessOrEqualL(B: ParityGameVertex[], C: ParityGameVertex[], l: number) {
    const B1 = B.filter((v) => v.priority > l);
    const C1 = C.filter((v) => v.priority > l);
    return SI.maxDiffLessOrEqual(B1, C1);
  },
  // maxDiffEqualL(B, C, l) {
  //   maxDiffLessOrEqualL(B, C, l) && maxDiffLessOrEqualL(C, B, l);
  //}
  // maxDiffLessL(B, C, l) {
  //   maxDiffLessOrEqualL(B, C, l) && !maxDiffLessOrEqualL(C, B, l);
  //}

  run(graph) {
    const initialVertex = graph.vertices[0];
    initialVertex.highlight(1);
    graph.setCursor(initialVertex);
  },
};

export default SI.run;
