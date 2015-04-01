define [ "gralog/extensible"
], (Extensible) -> describe "An Extensible derived class with a delayed property", ->
  beforeEach ->
    class @D extends Extensible
      onlyInD: -> "D"
    @D.injectDelayedProperty "delayed", class
      constructor: (@parent) -> @p = "P"

  it "has the property in its prototype", ->
    expect(Object.hasOwnProperty.call(@D::, "delayed")).toBe(true)
  it "has the property with a getter", ->
    desc = Object.getOwnPropertyDescriptor(@D::, "delayed")
    expect(desc.get).toBeDefined()
  it "does not allow overriding of existing properties", ->
    expect(=> @D.injectDelayedProperty "onlyInD", ->).toThrow(
      new Error("Property \"onlyInD\" already exists"))
  it "does not have the property on fresh instances", ->
    expect(Object.hasOwnProperty.call(new @D, "delayed")).toBe(false)

  describe "on access", ->
    beforeEach ->
      @d = new @D
      @d.delayed.foo = 0

    it "gains the property", ->
      expect(Object.hasOwnProperty.call(@d, "delayed")).toBe(true)
    it "gains a plain property without getter/setter", ->
      desc = Object.getOwnPropertyDescriptor(@d, "delayed")
      expect(desc.get).not.toBeDefined()
      expect(desc.set).not.toBeDefined()
    it "initializes the property", ->
      expect(@d.delayed.parent).toBe(@d)
      expect(@d.delayed.p).toEqual("P")
    it "recreates the property on new instances", ->
      expect((new @D).delayed).not.toBe(@d.delayed)
