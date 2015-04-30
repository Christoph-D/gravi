G = require "gravi/graph"
CustomProperty = require "gravi/customproperty"

describe "A custom property", ->
  tests = (description, T, v) ->
    describe description, ->
      beforeEach ->
        @D =
          name: "foo",
          type: "string",
          defaultValue: "foo",
        @T = CustomProperty.add(T, @D)
        @v = new @T
      it "exists", ->
        expect(@v.foo).toEqual("foo")
      it "takes values", ->
        @v.foo = "bar"
        expect(@v.foo).toEqual("bar")
      it "rejects values of wrong type", ->
        expect(=> @v.foo = 1).toThrow(
          new TypeError('Property "foo" received invalid type "number", excepted "string"'))
        expect(=> @v.foo = []).toThrow(
          new TypeError('Property "foo" received invalid type "object", excepted "string"'))
        expect(=> @v.foo = {}).toThrow(
          new TypeError('Property "foo" received invalid type "object", excepted "string"'))
      it "cannot be declared twice", ->
        expect(=> CustomProperty.add(@T, @D)).toThrow(
          new TypeError("Custom property \"foo\" already exists."))
      it "is enumerable", ->
        expect(p for own p of @v).toContain("foo")
      it "internal property list is not enumerable", ->
        expect(p for own p of @v).not.toContain("_properties")
      it "fires the change event exactly once per change", ->
        a = f: ->
        spyOn(a, 'f')
        @v.on("changeFoo", a.f)
        @v.foo = "bar"
        # Jasmine v2
        #expect(a.f.calls.count()).toEqual(1)
        expect(a.f).toHaveBeenCalled()

      describe "when copied", ->
        beforeEach ->
          @v.foo = "v" # Change from the default value
          @w = new @T @v
        it "is preserved", ->
          expect(@w.foo).toEqual("v")
        describe "after modification", ->
          beforeEach -> @w.foo = "w"
          it "has the new value", ->
            expect(@w.foo).toEqual("w")
          it "has been really copied", ->
            # Modifying @w should not modify @v.
            expect(@v.foo).toEqual("v")

  tests "on vertices", G.Vertex
  tests "on edges", G.Edge
