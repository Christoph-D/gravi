describe "An Extensible derived class", ->
  beforeEach ->
    class @D extends Extensible
      constructor: ->
        @foo ?= []
        @foo.push("D")
        super
      overrideThis: -> "overrideThis"
      arguments: (a, b) -> a
      onlyInD: -> "D"
      @static = 5
    class @M
      constructor: (a, b) ->
        @foo ?= []
        @foo.push("M#{a ? ""}")
      overrideThis: -> [].concat(@super.overrideThis(), "overridden")
      onlyInM: -> "onlyInM"
      arguments: (a, b) -> @super.arguments(a, b) + 1
      p = 8
      incPrivate: -> ++p
      getPrivate: -> p
    class @M2
      constructor: (a, b) ->
        @foo ?= []
        @foo.push("M2#{b ? ""}")
      overrideThis: -> [].concat(@super.overrideThis(), "overridden again")
      arguments: (a, b) -> b
      jumpToD: -> @super.onlyInD()
      jumpToM: -> @super.onlyInM()

  describe "with derived classes", ->
    it "allows mixins", ->
      class @D2 extends @D
        constructor: (a, b) -> super(b, a)
      @D2.mixin @M
      d2 = new @D2("a", "b")
      expect(d2.foo).toEqual(["D", "Mb"])
      expect(d2.overrideThis()).toEqual(["overrideThis", "overridden"])

  describe "with a destructive mixin", ->
    beforeEach -> @D.mixin @M

    it "allows mixins", ->
      d = new @D
      expect(d.onlyInM()).toEqual("onlyInM")
      expect(d.overrideThis()).toEqual(["overrideThis", "overridden"])
      expect(d.foo).toEqual(["D", "M"])

    it "works with arguments", ->
      expect((new @D).arguments(1, 3)).toEqual(2)

    it "works with private variables", ->
      d = new @D
      expect(d.getPrivate()).toEqual(8)
      d.incPrivate()
      expect(d.getPrivate()).toEqual(9)

    describe "chains", ->
      beforeEach -> @D.mixin @M2
      it "constructors from multiple mixins", ->
        expect((new @D).foo).toEqual(["D", "M", "M2"])
      it "constructors from multiple mixins with arguments", ->
        expect((new @D("a", "b")).foo).toEqual(["D", "Ma", "M2b"])
      it "methods", ->
        expect((new @D).overrideThis()).toEqual(["overrideThis", "overridden", "overridden again"])
      it "arguments", ->
        expect((new @D).arguments(1, 3)).toEqual(3)
      it "old methods not", ->
        d = new @D
        expect(d.jumpToD()).toEqual("D")
        expect(d.jumpToM()).toEqual("onlyInM")

    it "lets static variables persist", ->
      expect(@D.static).toEqual(5)
      @D.mixin @M2
      expect(@D.static).toEqual(5)

    describe "disallows mixin of reserved word", ->
      it "super", ->
        class S
          super: -> 0
        expect(-> @D.mixin S).toThrow()

      it "mixinConstructor", ->
        class S
          mixinConstructor: -> 0
        expect(-> @D.mixin S).toThrow()

  describe "with a non-destructive mixin", ->
    beforeEach ->
      @E = @D.newTypeWithMixin @M
      @F = @E.newTypeWithMixin @M2
      @d = new @D
      @e = new @E
      @f = new @F

    it "allows non-destructive mixins", ->
      expect(@e instanceof @D).toBe(true)
      expect(@e.onlyInM()).toEqual("onlyInM")
      expect(@e.overrideThis()).toEqual(["overrideThis", "overridden"])
      expect(@e.foo).toEqual(["D", "M"])

    it "does not change from non-destructive mixins", ->
      expect("onlyInM" of @d).toBe(false, "onlyInM should not exist after non-destructive mixin")
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
