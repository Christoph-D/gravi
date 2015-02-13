describe "An Extensible derived class", ->
  beforeEach ->
    class @D extends Extensible
      constructor: ->
        @foo ?= []
        @foo.push("D")
        super
      overrideThis: -> "overrideThis"
      arguments: (a, b) -> a
      @static = 5
    @M =
      constructor: ->
        @foo ?= []
        @foo.push("M")
      overrideThis: -> [].concat(@super(), "overridden")
      newMethod: -> "newMethod"
      arguments: (a, b) -> @super(a, b) + 1
    @M2 =
      constructor: ->
        @foo ?= []
        @foo.push("M2")
      overrideThis: -> [].concat(@super(), "overridden again")
      arguments: (a, b) -> b

  describe "with a destructive mixin", ->
    beforeEach ->
      @D.mixin @M

    it "allows mixins", ->
      d = new @D
      expect(d.newMethod()).toEqual("newMethod")
      expect(d.overrideThis()).toEqual(["overrideThis", "overridden"])
      expect(d.foo).toEqual(["D", "M"])

    it "chains constructors from multiple mixins", ->
      @D.mixin @M2
      d = new @D
      expect(d.foo).toEqual(["D", "M", "M2"])

    it "chains methods", ->
      @D.mixin @M2
      d = new @D
      expect(d.overrideThis()).toEqual(["overrideThis", "overridden", "overridden again"])

    it "works with arguments", ->
      d = new @D
      expect(d.arguments(1, 3)).toEqual(2)

    it "works with arguments with multiple mixins", ->
      @D.mixin @M2
      d = new @D
      expect(d.arguments(1, 3)).toEqual(3)

    it "static variables persist", ->
      expect(@D.static).toEqual(5)
      @D.mixin @M2
      expect(@D.static).toEqual(5)

  describe "with a non-destructive mixin", ->
    beforeEach ->
      @E = @D.newTypeWithMixin @M
      @F = @E.newTypeWithMixin @M2
      @d = new @D
      @e = new @E
      @f = new @F

    it "allows non-destructive mixins", ->
      expect(@e instanceof @D).toBe(true)
      expect(@e.newMethod()).toEqual("newMethod")
      expect(@e.overrideThis()).toEqual(["overrideThis", "overridden"])
      expect(@e.foo).toEqual(["D", "M"])

    it "does not change from non-destructive mixins", ->
      expect("newMethod" of @d).toBe(false, "newMethod should not exist after non-destructive mixin")
      expect(@d.overrideThis()).toEqual("overrideThis", "The original class should not be changed by a non-destructive mixin")
      expect(@d.foo).toEqual(["D"])

    it "chains constructors from multiple mixins", ->
      expect(@f.foo).toEqual(["D", "M", "M2"])

    it "works with arguments", ->
      expect(@e.arguments(1, 3)).toEqual(2)

    it "works with arguments with multiple mixins", ->
      expect(@f.arguments(1, 3)).toEqual(3)

    it "static variables persist", ->
      expect(@E.static).toEqual(5)
      expect(@F.static).toEqual(5)
