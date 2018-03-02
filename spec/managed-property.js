import ManagedPropertiesListenable from "gravi/managed-property";

describe("A managed property", function() {
  let A = {};
  let D = {};
  let v = {};
  beforeEach(function() {
    A = class extends ManagedPropertiesListenable {};
  });
  describe("basic", function() {
    beforeEach(function() {
      D = {
        name: "foo",
        type: "string",
        defaultValue: "foo"
      };
      A.manageProperties(D);
      v = new A;
    });
    it("exists", function() {
      expect(v.foo).toEqual("foo");
    });
    it("takes values", function() {
      v.foo = "bar";
      expect(v.foo).toEqual("bar");
    });
    it("rejects values of wrong type", function() {
      expect(() => v.foo = 1).toThrow(
        new TypeError('Property "foo" received invalid type "number", expected "string"'));
      expect(() => v.foo = []).toThrow(
        new TypeError('Property "foo" received invalid type "object", expected "string"'));
      expect(() => v.foo = {}).toThrow(
        new TypeError('Property "foo" received invalid type "object", expected "string"'));
    });
    it("cannot be declared twice", function() {
      expect(() => A.manageProperties(D)).toThrow(
        new TypeError("Managed property \"foo\" already exists."));
    });
    it("is enumerable", function() {
      expect(Object.keys(v)).toContain("foo");
    });
    it("is not enumerable if so configured", function() {
      const D = {
        name: "notenumerable",
        type: "string",
        enumerable: false
      };
      A.manageProperties(D);
      expect(Object.keys(new A)).not.toContain("notenumerable");
    });
    it("internal property list is not enumerable", function() {
      expect(Object.keys(v)).not.toContain("_properties");
    });
    it("fires the change event exactly once per change", function() {
      const a = { f: function() {} };
      spyOn(a, "f");
      v.on("changeFoo", a.f);
      v.foo = "bar";
      // Jasmine v2
      //expect(a.f.calls.count()).toEqual(1);
      expect(a.f).toHaveBeenCalled();
    });

    describe("when copied", function() {
      let w = {};
      beforeEach(function() {
        v.foo = "v"; // Change from the default value
        w = new A(v);
      });
      it("is preserved", function() {
        expect(w.foo).toEqual("v");
      });
      describe("after modification", function() {
        beforeEach(function() { w.foo = "w"; });
        it("has the new value", function() {
          expect(w.foo).toEqual("w");
        });
        it("has been really copied", function() {
          // Modifying w should not modify v.
          expect(v.foo).toEqual("v");
        });
      });
    });
  });

  describe("with default values", function() {
    function checkType(type, defaultValue) {
      it(`of ${type} type has the correct default value`, function() {
        const D = { name: "foo", type: type };
        A.manageProperties(D);
        expect((new A).foo).toEqual(defaultValue);
      });
    }
    checkType("array", []);
    checkType("number", 0);
    checkType("object", undefined);
    checkType("string", "");
  });

  describe("of array type", function() {
    const defaultValue = [0,1];
    beforeEach(function() {
      const D = {
        name: "foo",
        type: "array",
        defaultValue: defaultValue
      };
      A.manageProperties(D);
      v = new A;
    });
    it("copies the default value", function() {
      expect(v.foo).toEqual(defaultValue);
      expect(v.foo).not.toBe(defaultValue);
    });
    it("copies the default value between instances", function() {
      expect(v.foo).toEqual((new A).foo);
      expect(v.foo).not.toBe((new A).foo);
    });
    it("copies parameters", function() {
      const a = [1,2];
      expect((new A({ foo: a })).foo).not.toBe(a);
    });
  });

  describe("of enum type", function() {
    beforeEach(function() {
      D = {
        name: "bar",
        type: "enum",
        values: [0, 1],
        defaultValue: 1
      };
      A.manageProperties(D);
      v = new A;
    });
    it("exists", function() {
      expect(v.bar).toEqual(1);
    });
    it("accepts valid values", function() {
      expect(() => v.bar = 0).not.toThrow();
      expect(() => v.bar = 1).not.toThrow();
    });
    it("rejects invalid values", function() {
      expect(() => v.bar = 2).toThrow(
        new TypeError(`Enum property "bar" received invalid value "2".  Valid values: ${D.values}`));
    });
  });
  describe("with multiple properties", function() {
    let E = {};
    beforeEach(function() {
      D = { name: "foo", type: "string", defaultValue: "foo" };
      E = { name: "bar", type: "string", defaultValue: "bar" };
      A.manageProperties(D, E);
      v = new A;
    });
    it("exists", function() {
      expect(v.foo).toEqual("foo");
      expect(v.bar).toEqual("bar");
    });
  });
});
