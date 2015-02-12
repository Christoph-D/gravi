describe "An Extensible derived class", ->
  beforeEach ->
    class @D extends Extensible
      constructor: ->
        unless @foo?
          @foo = []
        @foo.push("D")
        super
      overrideThis: -> "overrideThis"
    @M =
      constructor: ->
        unless @foo?
          @foo = []
        @foo.push("M")
      overrideThis: -> "overridden"
      newMethod: -> "newMethod"
    @M2 =
      constructor: ->
        unless @foo?
          @foo = []
        @foo.push("M2")

  describe "with a destructive mixin", ->
    beforeEach ->
      @D.mixin @M

    it "allows mixins", ->
      d = new @D
      expect(d.newMethod()).toEqual("newMethod")
      expect(d.overrideThis()).toEqual("overridden")
      expect(d.foo).toEqual(["D", "M"])

    it "chains constructors from multiple mixins", ->
      @D.mixin @M2
      d = new @D
      expect(d.foo).toEqual(["D", "M", "M2"])

  describe "with a non-destructive mixin", ->
    beforeEach ->
      E = @D.newTypeWithMixin @M
      @d = new @D
      @e = new E

    it "allows non-destructive mixins", ->
      expect(@e instanceof @D).toBe(true)
      expect(@e.newMethod()).toEqual("newMethod")
      expect(@e.overrideThis()).toEqual("overridden")
      expect(@e.foo).toEqual(["D", "M"])

    it "does not change from non-destructive mixins", ->
      expect("newMethod" of @d).toBe(false, "newMethod should not exist after non-destructive mixin")
      expect(@d.overrideThis()).toEqual("overrideThis", "Methods should be overridden by non-destructive mixin")
      expect(@d.foo).toEqual(["D"])
