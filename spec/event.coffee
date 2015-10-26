Event = require "gravi/event"

describe "A listenable object", ->
  A = {}
  a = {}
  seen = 0
  beforeEach ->
    A = Event.makeListenable class
      constructor: -> @constructorCalled = true
      foo: -> @dispatch("foo")
    a = new A
    seen = 0

  it "calls the constructor", ->
    expect(a.constructorCalled).toBe(true)

  describe "with a one-time listener", ->
    beforeEach -> a.on("foo", (-> seen += 1), once: true)

    it "dispatches events once", ->
      a.foo()
      a.foo()
      expect(seen).toEqual(1)

    it "does not allow removing the handler", ->
      a.removePermanentListeners("foo")
      a.foo()
      expect(seen).toEqual(1)

    it "chains handlers", ->
      a.on("foo", -> seen += 1)
      a.foo() # increments seen twice
      expect(seen).toEqual(2)

    it "applies the correct \"this\" context", ->
      a.on("foo", -> expect(this).toBe(a))
      a.foo()

  describe "with a listener", ->
    beforeEach -> a.on("foo", -> seen += 1)

    it "dispatches events", ->
      a.foo()
      a.foo()
      expect(seen).toEqual(2)

    it "allows removing the handler", ->
      a.removePermanentListeners("foo")
      a.foo()
      expect(seen).toEqual(0)

    it "chains handlers", ->
      a.on("foo", -> seen += 1)
      a.foo() # increments seen twice
      expect(seen).toEqual(2)

    it "applies the correct \"this\" context", ->
      a.on("foo", -> expect(this).toBe(a))
      a.foo()

  describe "with a static listener", ->
    beforeEach -> A.onStatic("foo", -> seen += 1)

    it "dispatches events", ->
      a.foo()
      a.foo()
      expect(seen).toEqual(2)

    it "allows removing the handler", ->
      A.removeStaticListeners("foo")
      a.foo()
      expect(seen).toEqual(0)

    it "chains handlers", ->
      A.onStatic("foo", -> seen += 1)
      a.foo() # increments seen twice
      expect(seen).toEqual(2)

    it "dispatches events on new objects", ->
      (new A).foo()
      expect(seen).toEqual(1)

    it "applies the correct \"this\" context", ->
      A.onStatic("foo", -> expect(this).toBe(a))
      a.foo()
