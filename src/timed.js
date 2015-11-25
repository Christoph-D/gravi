export default class TimedProperty {
  constructor(initialValue = null, interpolateKeys = []) {
    this.initialValue = initialValue;
    this.interpolateKeys = interpolateKeys;
    this.value = { 0: initialValue };
  }

  interpolate(x, y, t) {
    const result = {};
    for(let key of this.interpolateKeys) {
      if(!(key in x && key in y))
        throw `Missing key: ${key}`
      result[key] = x[key] * (1 - t) + y[key] * t;
    }
    return result;
  }

  valueAtTime(time, value) {
    if(arguments.length === 2) {
      this.value[time] = value;
      return this;
    }

    const lastTime = Math.max(...Object.keys(this.value).filter(v => v <= time));
    if(this.interpolateKeys.length === 0)
      return this.value[lastTime];

    const nextTime = Math.min(...Object.keys(this.value).filter(v => v > lastTime));
    if(nextTime === Number.POSITIVE_INFINITY)
      return this.value[lastTime];
    const normedDiff = (time - lastTime) / (nextTime - lastTime);
    return this.interpolate(this.value[lastTime], this.value[nextTime], normedDiff);
  }

  reset() {
    this.value = { 0: this.initialValue };
    return this;
  }
}
