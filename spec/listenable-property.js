import Listenable from "gravi/listenable";
import addListenableProperty from "gravi/listenable-property";

describe("A listenable property", function() {
  let A = {};
  let D = {};
  let T = {};
  let v = {};
  beforeEach(function() {
    A = class extends Listenable {};
  });
  describe("basic", function() {
    beforeEach(function() {
      D = {
        name: "foo",
        type: "string",
        defaultValue: "foo"
      };
      T = addListenableProperty(A, D);
      v = new T;
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
      expect(() => addListenableProperty(T, D)).toThrow(
        new TypeError("Listenable property \"foo\" already exists."));
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
      T = addListenableProperty(A, D);
      expect(Object.keys(new T)).not.toContain("notenumerable");
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
        w = new T(v);
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
        T = addListenableProperty(A, D);
        expect((new T).foo).toEqual(defaultValue);
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
      T = addListenableProperty(A, D);
      v = new T;
    });
    it("copies the default value", function() {
      expect(v.foo).toEqual(defaultValue);
      expect(v.foo).not.toBe(defaultValue);
    });
    it("copies the default value between instances", function() {
      expect(v.foo).toEqual((new T).foo);
      expect(v.foo).not.toBe((new T).foo);
    });
    it("copies parameters", function() {
      const a = [1,2];
      expect((new T({ foo: a })).foo).not.toBe(a);
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
      T = addListenableProperty(A, D);
      v = new T;
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
        new TypeError(`Enum property \"bar\" received invalid value \"2\".  Valid values: ${D.values}`));
    });
  });
  describe("with multiple properties", function() {
    let E = {};
    beforeEach(function() {
      D = { name: "foo", type: "string", defaultValue: "foo" };
      E = { name: "bar", type: "string", defaultValue: "bar" };
      T = addListenableProperty(A, D, E);
      v = new T;
    });
    it("exists", function() {
      expect(v.foo).toEqual("foo");
      expect(v.bar).toEqual("bar");
    });
    it("rejects repeated properties", function() {
      expect(() => addListenableProperty(A, D, D)).toThrow(
        new TypeError("Listenable property \"foo\" cannot be added twice."));
    });
  });
});
