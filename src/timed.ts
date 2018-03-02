export default class TimedProperty {
  private initialValue: any;
  private interpolateKeys: any[];
  private value: any;

  constructor(initialValue: string | null = null, interpolateKeys: any[] = []) {
    this.initialValue = initialValue;
    this.interpolateKeys = interpolateKeys;
    this.value = { 0: initialValue };
  }

  public interpolate(x, y, t) {
    const result = {};
    for(const key of this.interpolateKeys) {
      if(!(key in x && key in y))
        throw RangeError(`Missing key: ${key}`);
      result[key] = x[key] * (1 - t) + y[key] * t;
    }
    return result;
  }

  public valueAtTime(time, value?) {
    if(arguments.length === 2) {
      this.value[time] = value;
      return this;
    }

    const lastTime = Math.max(...(Object.keys(this.value) as any).filter(v => v <= time));
    if(this.interpolateKeys.length === 0)
      return this.value[lastTime];

    const nextTime = Math.min(...(Object.keys(this.value) as any).filter(v => v > lastTime));
    if(nextTime === Number.POSITIVE_INFINITY)
      return this.value[lastTime];
    const normedDiff = (time - lastTime) / (nextTime - lastTime);
    return this.interpolate(this.value[lastTime], this.value[nextTime], normedDiff);
  }

  public reset() {
    this.value = { 0: this.initialValue };
    return this;
  }
}
