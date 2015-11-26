import Listenable from "gravi/listenable";

describe("A listenable object", function() {
  let A = {};
  let a = {};
  let seen = 0;
  function incrementSeen() { ++seen; }
  beforeEach(function() {
    A = class extends Listenable {
      foo() { this.dispatch("foo"); }
    };
    a = new A;
    seen = 0;
  });

  describe("with a one-time listener", function() {
    beforeEach(() => a.on("foo", incrementSeen, { once: true }));

    it("dispatches events once", function() {
      a.foo();
      a.foo();
      expect(seen).toEqual(1);
    });

    it("does not allow removing the handler", function() {
      a.removePermanentListeners("foo");
      a.foo();
      expect(seen).toEqual(1);
    });

    it("chains handlers", function() {
      a.on("foo", incrementSeen);
      a.foo(); // increments seen twice
      expect(seen).toEqual(2);
    });

    it("applies the correct \"this\" context", function() {
      a.on("foo", function() { expect(this).toBe(a); });
      a.foo();
    });
  });

  describe("with a listener", function() {
    beforeEach(() => a.on("foo", incrementSeen));

    it("dispatches events", function() {
      a.foo();
      a.foo();
      expect(seen).toEqual(2);
    });

    it("allows removing the handler", function() {
      a.removePermanentListeners("foo");
      a.foo();
      expect(seen).toEqual(0);
    });

    it("chains handlers", function() {
      a.on("foo", incrementSeen);
      a.foo(); // increments seen twice
      expect(seen).toEqual(2);
    });

    it("applies the correct \"this\" context", function() {
      a.on("foo", function() { expect(this).toBe(a); });
      a.foo();
    });
  });

  describe("with a static listener", function() {
    beforeEach(() => A.onStatic("foo", incrementSeen));

    it("dispatches events", function() {
      a.foo();
      a.foo();
      expect(seen).toEqual(2);
    });

    it("allows removing the handler", function() {
      A.removeStaticListeners("foo");
      a.foo();
      expect(seen).toEqual(0);
    });

    it("chains handlers", function() {
      A.onStatic("foo", incrementSeen);
      a.foo(); // increments seen twice
      expect(seen).toEqual(2);
    });

    it("dispatches events on new objects", function() {
      (new A).foo();
      expect(seen).toEqual(1);
    });

    it("applies the correct \"this\" context", function() {
      A.onStatic("foo", function() { expect(this).toBe(a); });
      a.foo();
    });
  });

  it("does not allow a static listener on the base class", function() {
    expect(() => Listenable.onStatic("foo", incrementSeen)).toThrow();
  });
});
