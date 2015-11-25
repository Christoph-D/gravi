import TimedProperty from "gravi/timed";

describe("A TimedProperty", function() {
  let t = {};
  describe("non-interpolating on a string", function() {
    beforeEach(() => t = new TimedProperty("initial"));

    it("has the correct initial value", function() {
      expect(t.valueAtTime(0)).toEqual("initial");
    });

    it("has correct timed values", function() {
      t.valueAtTime(1, "first");
      t.valueAtTime(3, "third");
      const values = [0,1,2,3,4].map(time => t.valueAtTime(time));
      expect(values).toEqual(["initial", "first", "first", "third", "third"]);
    });

    it("does not interpolate", function() {
      t.valueAtTime(1, "first");
      t.valueAtTime(3, "third");
      const values = [0.5,1.3,2.99,3.01].map(time => t.valueAtTime(time));
      expect(values).toEqual(["initial", "first", "first", "third"]);
    });

    it("is resettable", function() {
      t.valueAtTime(1, "first");
      t.valueAtTime(3, "third");
      t.reset();
      const values = [0,1,2,3,4].map(time => t.valueAtTime(time));
      expect(values).toEqual([0,1,2,3,4].map(() => "initial"));
    });
  });

  describe("interpolating on an x/y position", function() {
    beforeEach(() => t = new TimedProperty({ x: 0, y: 0 }, ["x", "y"]));

    it("has the correct initial value", function() {
      expect(t.valueAtTime(0)).toEqual({ x: 0, y: 0 });
    });

    it("interpolates", function() {
      t.valueAtTime(1, { x: 2, y: 1 });
      t.valueAtTime(3, { x: 0, y: 0 });
      expect(t.valueAtTime(2)).toEqual({ x: 1, y: 0.5 });
    });

    it("ignores other properties", function() {
      t.valueAtTime(1, { x: 2, y: 1, z: 2 });
      t.valueAtTime(3, { x: 0, y: 0, z: 5 });
      expect(t.valueAtTime(2)).toEqual({ x: 1, y: 0.5 });
    });

    it("does not interpolate between different types", function() {
      t.valueAtTime(1, "foo");
      expect(() => t.valueAtTime(0.5)).toThrow();
    });

    it("does not interpolate if attributes are missing", function() {
      t.valueAtTime(1, { x: 1 }); // y is missing
      expect(() => t.valueAtTime(0.5)).toThrow();
    });

    it("is resettable", function() {
      t.valueAtTime(1, { x: 2, y: 1 });
      t.valueAtTime(3, { x: 0, y: 0 });
      t.reset();
      const values = [0,1,2,3,4].map(time => t.valueAtTime(time));
      expect(values).toEqual([0,1,2,3,4].map(() => { return { x: 0, y: 0 }; }));
    });
  });
});
