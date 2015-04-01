define [ "gralog/extensible"
], (Extensible) -> describe "An Extensible derived class with a delayed property", ->
  beforeEach ->
    class @D extends Extensible
      onlyInD: -> "D"
    @D.injectDelayedProperty "delayed", class
      constructor: (@parent) -> @p = "P"

  it "has the property in its prototype", ->
    expect(Object.hasOwnProperty.call(@D::, "delayed")).toBe(true)

  it "does not allow access to the property in its prototype", ->
    expect(=> @D.prototype.delayed).toThrow(
      new Error("This property is only accessible from an instance"))

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

  describe "with derived classes", ->
    beforeEach ->
      class @E extends @D
      @E.injectDelayedProperty "delayedE", class
        constructor: (@parent) ->

    it "provides the property with the correct parent", ->
      e = new @E
      expect(e.delayed.parent).toBe(e)
      expect(e.delayedE.parent).toBe(e)

    it "does not inadvertantly instantiate the property in the base class", ->
      desc = Object.getOwnPropertyDescriptor(@D::, "delayed")
      expect(desc.get).toBeDefined() # still a special property with a getter

    it "does not inadvertantly instantiate the property in the derived class", ->
      desc = Object.getOwnPropertyDescriptor(@E::, "delayedE")
      expect(desc.get).toBeDefined() # still a special property with a getter

  describe "with mixins", ->
    beforeEach ->
      class @E
      Extensible.injectDelayedProperty.call @E, "delayedE", class
        constructor: (@parent) ->
      @D.mixin @E

    it "provides all delayed properties", ->
      d = new @D
      expect(d.delayed.parent).toBe(d)
      expect(d.delayedE.parent).toBe(d)

    it "does not inadvertantly instantiate the property in the extended class", ->
      desc = Object.getOwnPropertyDescriptor(@D::, "delayed")
      expect(desc.get).toBeDefined() # still a special property with a getter

    it "does not inadvertantly instantiate the property in the mixin", ->
      desc = Object.getOwnPropertyDescriptor(@E::, "delayedE")
      expect(desc.get).toBeDefined() # still a special property with a getter
