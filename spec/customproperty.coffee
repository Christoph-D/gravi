G = require "gravi/graph"
Event = require "gravi/event"
CustomProperty = require "gravi/customproperty"

describe "A custom property", ->
  A = {}
  D = {}
  T = {}
  v = {}
  beforeEach ->
    A = Event.makeListenable class
    D =
      name: "foo"
      type: "string"
      defaultValue: "foo"
    T = CustomProperty.add(A, D)
    v = new T
  it "exists", ->
    expect(v.foo).toEqual("foo")
  it "takes values", ->
    v.foo = "bar"
    expect(v.foo).toEqual("bar")
  it "rejects values of wrong type", ->
    expect(-> v.foo = 1).toThrow(
      new TypeError('Property "foo" received invalid type "number", excepted "string"'))
    expect(-> v.foo = []).toThrow(
      new TypeError('Property "foo" received invalid type "object", excepted "string"'))
    expect(-> v.foo = {}).toThrow(
      new TypeError('Property "foo" received invalid type "object", excepted "string"'))
  it "cannot be declared twice", ->
    expect(-> CustomProperty.add(T, D)).toThrow(
      new TypeError("Custom property \"foo\" already exists."))
  it "is enumerable", ->
    expect(p for p of v).toContain("foo")
  it "is not enumerable if so configured", ->
    D =
      name: "notenumerable"
      type: "string"
      enumerable: false
    T = CustomProperty.add(A, D)
    expect(p for p of new T).not.toContain("notenumerable")
  it "is not enumerable as an own property", ->
    expect(p for own p of v).not.toContain("foo")
  it "internal property list is not enumerable", ->
    expect(p for p of v).not.toContain("_properties")
  it "fires the change event exactly once per change", ->
    a = f: ->
    spyOn(a, 'f')
    v.on("changeFoo", a.f)
    v.foo = "bar"
    # Jasmine v2
    #expect(a.f.calls.count()).toEqual(1)
    expect(a.f).toHaveBeenCalled()

  describe "when copied", ->
    w = {}
    beforeEach ->
      v.foo = "v" # Change from the default value
      w = new T v
    it "is preserved", ->
      expect(w.foo).toEqual("v")
    describe "after modification", ->
      beforeEach -> w.foo = "w"
      it "has the new value", ->
        expect(w.foo).toEqual("w")
      it "has been really copied", ->
        # Modifying w should not modify v.
        expect(v.foo).toEqual("v")

  describe "of enum type", ->
    beforeEach ->
      D =
        name: "bar"
        type: "enum"
        values: [0, 1]
        defaultValue: 1
      T = CustomProperty.add(A, D)
      v = new T
    it "exists", ->
      expect(v.bar).toEqual(1)
    it "accepts valid values", ->
      expect(-> v.bar = 0).not.toThrow()
      expect(-> v.bar = 1).not.toThrow()
    it "rejects invalid values", ->
      expect(-> v.bar = 2).toThrow(
        new TypeError("Enum property \"bar\" received invalid value \"2\""))
