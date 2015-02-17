describe "A VertexProperty", ->
  beforeEach ->
    @D =
      name: "foo",
      type: "string",
      value: "foo",
      pretty: (v) -> "<#{v}>"
    @V = addVertexProperty(Vertex, @D)
    @v = new @V

  it "exists", ->
    expect(@v.foo()).toEqual("foo")
  it "takes values", ->
    @v.foo("bar")
    expect(@v.foo()).toEqual("bar")
  it "can be pretty printed", ->
    expect(@v.foo.pretty()).toEqual("<foo>")
  it "cannot be declared twice", ->
    expect(=> addVertexProperty(@V, @D)).toThrow(
      new TypeError("Vertex property \"foo\" already exists."))
  it "cannot accidentally be overriden", ->
    expect(=> @v.foo = "bar").toThrow()
  it "cannot be deleted", ->
    expect(=> delete @v.foo).toThrow()
  it "is enumerable", ->
    expect(p for own p of @v).toContain("foo")

  describe "when copied", ->
    beforeEach ->
      @v.foo("v") # Change from the default value
      @w = new @V @v
    it "is preserved", ->
      expect(@w.foo()).toEqual("v")
    describe "after modification", ->
      beforeEach -> @w.foo("w")
      it "has the new value", ->
        expect(@w.foo()).toEqual("w")
      it "can be pretty printed", ->
        expect(@w.foo.pretty()).toEqual("<w>")
      it "has been really copied", ->
        # Modifying @w should not modify @v.
        expect(@v.foo()).toEqual("v")
      it "cannot accidentally be overriden", ->
        expect(=> @w.foo = "bar").toThrow()
