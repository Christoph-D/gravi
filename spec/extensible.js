import mixin from "gravi/extensible";
/*
describe("An Extensible derived class", function() {
  let D = {};
  let M = {};
  let M2 = {};
  beforeEach(function() {
    D = class {
      constructor() {
        if(this.foo == null)
          this.foo = [];
        this.foo.push("D");
      }
      overrideThis() { return "overrideThis"; }
      overrideThisLater() { this.super.overrideThisLater(); } // Should not be possible
      arguments(a, b) { return a; }
      onlyInD() { return "D"; }
    };
    D.static = 5;
    let p = 8;
    M = class {
      constructor(a, b) {
        if(this.foo == null)
          this.foo = [];
        this.foo.push(`M${a != null ? a : ""}`);
        this.p = 8;
      }
      overrideThis() { return [].concat(this.super.overrideThis(), "overridden"); }
      onlyInM() { return "onlyInM"; }
      arguments(a, b) { return this.super.arguments(a, b) + 1; }
      incPrivate() { ++p; }
      getPrivate() { return p; }
    };
    M.newStatic = 7;
    M2 = class {
      constructor(a, b) {
        if(this.foo == null)
          this.foo = [];
        this.foo.push(`M2${b != null ? b : ""}`);
      }
      overrideThis() { return [].concat(this.super.overrideThis(), "overridden again"); }
      overrideThisLater() { return [].concat(this.super.overrideThisLater(), "overridden"); }
      arguments(a, b) { return b; }
      jumpToD() { this.super.onlyInD(); }
      jumpToM() { this.super.onlyInM(); }
    };
  });

  fit("allows mixins", function() {
    let d2 = new D2("a", "b");
    expect(d2.foo).toEqual(["D", "Mb"]);
    expect(d2.overrideThis()).toEqual(["overrideThis", "overridden"]);
  });
    */

  /*
  describe("with derived classes", function() {
    D2 = {};
    beforeEach(function() {
      class D2 extends D {
        constructor(a, b) { super(b, a); }
      }
      D2 = mixin(D2, M);
    });
               
    it("allows mixins", function() {
      d2 = new D2("a", "b")
      expect(d2.foo).toEqual(["D", "Mb"])
      expect(d2.overrideThis()).toEqual(["overrideThis", "overridden"])
    });
    it("cleans this.super", function() {
      D2.mixin M2;
      d2 = new D2;
      expect(-> d2.overrideThisLater()).toThrow();
      expect(-> d2.onlyInD()).not.toThrow();
    });
    it("works with static variables", function() {
      expect(D2.newStatic).toEqual(7);
    });
  });

  describe("with derived mixins", function() {
    beforeEach(function() {
      D = mixin(D, M2);
      class M3 extends M {
        overrideThis() { return [].concat(super, "overriden in M3"); }
      }
      D = mixin(D, M3);
    });

    it("allows mixins", function() {
      d = new D("a", "b");
      expect(d.foo).toEqual(["D", "M2b", "Ma"]);
      expect(d.overrideThis()).toEqual(["overrideThis", "overridden again", "overridden", "overriden in M3"]);
      expect(d.onlyInM()).toEqual("onlyInM");
    });
    it("works with static variables", function() {
      expect(D.newStatic).toEqual(7);
    });
  });

  describe("with an in-place mixin", function() {
    beforeEach(() => D.mixin M);

    it("allows it", function() {
      d = new D
      expect(d.onlyInM()).toEqual("onlyInM")
      expect(d.overrideThis()).toEqual(["overrideThis", "overridden"])
      expect(d.foo).toEqual(["D", "M"])
    });
    it("works with arguments", function() {
      expect((new D).arguments(1, 3)).toEqual(2)
    });
    it("works with static variables", function() {
      expect(D.newStatic).toEqual(7)
    });
    it("works with private variables", function() {
      d = new D
      expect(d.getPrivate()).toEqual(8)
      d.incPrivate()
      expect(d.getPrivate()).toEqual(9)
    });
    it("lets static variables persist", function() {
      expect(D.static).toEqual(5)
      D.mixin M2
      expect(D.static).toEqual(5)
    });

    describe("chains", function() {
      beforeEach(() => D = mixin(D, M2));
      it("constructors from multiple mixins", function() {
        expect((new D).foo).toEqual(["D", "M", "M2"]);
      });
      it("constructors from multiple mixins with arguments", function() {
        expect((new D("a", "b")).foo).toEqual(["D", "Ma", "M2b"]);
      });
      it("methods", function() {
        expect((new D).overrideThis()).toEqual(
          ["overrideThis", "overridden", "overridden again"]);
      });
      it("arguments", function() {
        expect((new D).arguments(1, 3)).toEqual(3);
      });
      it("with clean this.super", function() {
        expect(=> (new D).overrideThisLater()).toThrow();
      });
      it("no old methods", function() {
        expect((new D).jumpToM()).toEqual("onlyInM");
      });
    });
  });

  describe("disallows mixin of reserved word", function() {
    it("super", function() {
      class S {
        super() { return 0; }
      }
      expect(() => D.mixin(S)).toThrow();
    });
    it("mixinConstructor", function() {
      class S {
        __mixinConstructor() { return 0; }
      }
      expect(() => D.mixin(S)).toThrow();
    });
  });

  describe("with a non in-place mixin", function() {
    let E = {};
    let F = {};
    beforeEach(function() {
      E = D.newTypeWithMixin M;
      F = E.newTypeWithMixin M2;
      this.d = new D;
      this.e = new E;
      this.f = new F;
    });

    it("allows it", function() {
      expect(this.e instanceof D).toBe(true);
      expect(this.e.onlyInM()).toEqual("onlyInM");
      expect(this.e.overrideThis()).toEqual(["overrideThis", "overridden"]);
      expect(this.e.foo).toEqual(["D", "M"]);
    });
    it("does not change the original class", function() {
      expect("onlyInM" of this.d).toBe(false,
        "onlyInM should not exist after non in-place mixin")
      expect(this.d.overrideThis()).toEqual("overrideThis",
        "The original class should not be changed by a non in-place mixin")
      expect(this.d.foo).toEqual(["D"])
    });
    it("chains constructors from multiple mixins", function() {
      expect(this.f.foo).toEqual(["D", "M", "M2"])
    });
    it("works with arguments", function() {
      expect(this.e.arguments(1, 3)).toEqual(2)
    });
    it("works with arguments with multiple mixins", function() {
      expect(this.f.arguments(1, 3)).toEqual(3)
    });
    it("static variables persist", function() {
      expect(E.static).toEqual(5)
      expect(F.static).toEqual(5)
    });
  });
*/
//});
