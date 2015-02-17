describe "A non-interpolating TimedProperty on a string", ->
  t = {}
  beforeEach -> t = new TimedProperty "initial"

  it "has the correct initial value", ->
    expect(t.valueAtTime(0)).toEqual("initial")

  it "has correct timed values", ->
    t.valueAtTime(1, "first")
    t.valueAtTime(3, "third")
    values = (t.valueAtTime time for time in [0..4])
    expect(values).toEqual(["initial", "first", "first", "third", "third"])

  it "does not interpolate", ->
    t.valueAtTime(1, "first")
    t.valueAtTime(3, "third")
    values = (t.valueAtTime time for time in [0.5, 1.3, 2.99, 3.01])
    expect(values).toEqual(["initial", "first", "first", "third"])

  it "is resettable", ->
    t.valueAtTime(1, "first")
    t.valueAtTime(3, "third")
    t.reset()
    values = (t.valueAtTime time for time in [0..4])
    expect(values).toEqual("initial" for t in [0..4])

describe "An interpolating TimedProperty on an x/y position", ->
  t = {}
  beforeEach -> t = new TimedProperty x: 0, y: 0, ["x", "y"]

  it "has the correct initial value", ->
    expect(t.valueAtTime(0)).toEqual(x: 0, y: 0)

  it "interpolates", ->
    t.valueAtTime(1, x: 2, y: 1)
    t.valueAtTime(3, x: 0, y: 0)
    expect(t.valueAtTime(2)).toEqual(x: 1, y: 0.5)

  it "ignores other properties", ->
    t.valueAtTime(1, x: 2, y: 1, z: 2)
    t.valueAtTime(3, x: 0, y: 0, z: 5)
    expect(t.valueAtTime(2)).toEqual(x: 1, y: 0.5)

  it "does not interpolate between different types", ->
    t.valueAtTime(1, "foo")
    expect(-> t.valueAtTime(0.5)).toThrow()

  it "does not interpolate if attributes are missing", ->
    t.valueAtTime(1, x: 1) # y is missing
    expect(-> t.valueAtTime(0.5)).toThrow()

  it "is resettable", ->
    t.valueAtTime(1, x: 2, y: 1)
    t.valueAtTime(3, x: 0, y: 0)
    t.reset()
    values = (t.valueAtTime time for time in [0..4])
    expect(values).toEqual(x: 0, y: 0 for t in [0..4])
