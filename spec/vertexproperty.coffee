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
    expect(typeof @v.foo).toBe("string")
  it "takes values", ->
    expect(@v.foo).toBe("foo")
    @v.foo = "bar"
    expect(@v.foo).toBe("bar")
  it "can be pretty printed", ->
    expect(@v.pretty.foo()).toBe("<foo>")
  it "cannot be declared twice", ->
    expect(=> addVertexProperty(@V, @D)).toThrow(new TypeError("Vertex property \"foo\" already exists."))
