describe "A custom property", ->
  tests = (description, T, v) ->
    describe description, ->
      beforeEach ->
        @D =
          name: "foo",
          type: "string",
          value: "foo",
          pretty: (v) -> "<#{v}>"
        @T = addCustomProperty(T, @D)
        @v = new @T
      it "exists", ->
        expect(@v.foo).toEqual("foo")
      it "takes values", ->
        @v.foo = "bar"
        expect(@v.foo).toEqual("bar")
      it "can be pretty printed", ->
        expect(@v.prettyFoo()).toEqual("<foo>")
      it "cannot be declared twice", ->
        expect(=> addCustomProperty(@T, @D)).toThrow(
          new TypeError("Custom property \"foo\" already exists."))
      it "is enumerable", ->
        expect(p for own p of @v).toContain("foo")
      it "internal property list is not enumerable", ->
        expect(p for own p of @v).not.toContain("_properties")
      it "pretty printed property is not enumerable", ->
        expect(p for own p of @v).not.toContain("prettyFoo")
      it "calls the onChange function exactly once per change", ->
        a = f: ->
        spyOn(a, 'f')
        @v.onChangeFoo = a.f
        @v.foo = "bar"
        expect(a.f.calls.count()).toEqual(1)

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
          it "can be pretty printed", ->
            expect(@w.prettyFoo()).toEqual("<w>")
          it "has been really copied", ->
            # Modifying @w should not modify @v.
            expect(@v.foo).toEqual("v")

  tests "on vertices", Vertex
  tests "on edges", Edge
