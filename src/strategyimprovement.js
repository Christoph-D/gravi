// A play profile contains l, B, k.
export class PlayProfile {
  constructor({ l, B, k }) {
    this.l = l;
    this.B = B;
    this.k = k;
  }
  lessThanOrEqual(other) {
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
  reward(v) {
    if(v.priority != null)
      v = v.priority;
    if(v < 0)
      throw Error("Priority canot be negative");
    return v % 2 === 0 ? v : -v;
  },
  rewardLessOrEqual(v, w) { return SI.reward(v) <= SI.reward(w); },
  rewardLess(v, w) { return SI.reward(v) < SI.reward(w); },
  maxDiffLessOrEqual(B, C) {
    B = B.map(v => v.priority);
    C = C.map(v => v.priority);
    if(B.length === C.length) {
      let equal = true;
      for(let i = 0; i < B.length; ++i)
        if(B[i] !== C[i])
          equal = false;
      if(equal)
        return true;
    }
    const B2 = B.filter((v) => C.indexOf(v) === -1);
    const C2 = C.filter((v) => B.indexOf(v) === -1);
    const d = Math.max(...B2.concat(C2));
    return (B2.indexOf(d) !== -1 && d % 2 === 1) || (C2.indexOf(d) !== -1 && d % 2 === 0);
  },
  maxDiffLessOrEqualL(B, C, l) {
    B = B.filter((v) => v.priority > l);
    C = C.filter((v) => v.priority > l);
    return SI.maxDiffLessOrEqual(B, C);
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
  }
};

export default SI.run;
