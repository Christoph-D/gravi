import injectDelayedProperty from "gravi/delayedproperty";

describe("A class with a delayed property", function() {
  let D = {};
  beforeEach(function() {
    D = class {
      onlyInD() { return "D"; }
    };
    injectDelayedProperty(D, "delayed", class {
      constructor(parent) {
        this.parent = parent;
        this.p = "P";
      }
    });
  });

  it("has the property in its prototype", function() {
    expect(Reflect.apply(Object.hasOwnProperty, D.prototype, ["delayed"])).toBe(true);
  });

  it("does not allow access to the property in its prototype", function() {
    expect(() => D.prototype.delayed).toThrow(
      new Error("This property is only accessible from an instance"));
  });

  it("has the property with a getter", function() {
    const desc = Reflect.getOwnPropertyDescriptor(D.prototype, "delayed");
    expect(desc.get).toBeDefined();
  });

  it("does not allow overriding of existing properties", function() {
    expect(() => injectDelayedProperty(D, "onlyInD", class {})).toThrow(
      new Error("Property \"onlyInD\" already exists"));
  });

  it("does not have the property on fresh instances", function() {
    expect(Reflect.apply(Object.hasOwnProperty, new D, ["delayed"])).toBe(false);
  });

  describe("on access", function() {
    let d = {};
    beforeEach(function() {
      d = new D;
      d.delayed.foo = 0;
    });

    it("gains the property", function() {
      expect(Reflect.apply(Object.hasOwnProperty, d, ["delayed"])).toBe(true);
    });

    it("gains a plain property without getter/setter", function() {
      const desc = Reflect.getOwnPropertyDescriptor(d, "delayed");
      expect(desc.get).not.toBeDefined();
      expect(desc.set).not.toBeDefined();
    });

    it("initializes the property", function() {
      expect(d.delayed.parent).toBe(d);
      expect(d.delayed.p).toEqual("P");
    });

    it("recreates the property on new instances", function() {
      expect((new D).delayed).not.toBe(d.delayed);
    });
  });

  describe("with derived classes", function() {
    let E = {};
    beforeEach(function() {
      E = class extends D {};
      injectDelayedProperty(E, "delayedE", class {
        constructor(parent) { this.parent = parent; }
      });
    });

    it("provides the property with the correct parent", function() {
      const e = new E;
      expect(e.delayed.parent).toBe(e);
      expect(e.delayedE.parent).toBe(e);
    });

    it("does not inadvertantly instantiate the property in the base class", function() {
      const desc = Reflect.getOwnPropertyDescriptor(D.prototype, "delayed");
      expect(desc.get).toBeDefined(); // still a special property with a getter
    });

    it("does not inadvertantly instantiate the property in the derived class", function() {
      const desc = Reflect.getOwnPropertyDescriptor(E.prototype, "delayedE");
      expect(desc.get).toBeDefined(); // still a special property with a getter
    });
  });
});
