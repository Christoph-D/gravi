// Adds a property to the prototype of object.  This property replaces
// itself by a fresh template instance when accessed for the first
// time.  In effect, this is a property whose initialization cost
// (i.e., "new template") you only pay if you access it.
export default function injectDelayedProperty(object, propName, template) {
  if(propName in object.prototype)
    throw Error(`Property "${propName}" already exists`);
  Object.defineProperty(object.prototype, propName, {
    configurable: true,
    enumerable: true,
    get() {
      // Avoid accidental instantiation by preventing access except
      // via an instance.
      if(this === object.prototype)
        throw Error("This property is only accessible from an instance");
      // Instantiate the property and assign it as an own property to
      // this.
      Object.defineProperty(this, propName, {
        configurable: true,
        enumerable: true,
        writable: true,
        // Here this also refers to the instance.
        value: new template(this)
      });
      return this[propName];
    }
  });
}

/*

// Walks the prototype chain to find the descriptor of the given
// property.
function findDescriptor(object, name) {
  let desc = null;
  while(desc == null && object != null) {
    desc = Object.getOwnPropertyDescriptor(object, name);
    object = Object.getPrototypeOf(object);
  }
  return desc;
}

function getOwnDescriptors(object) {
  const descriptors = {};
  for(let p of Object.getOwnPropertyNames(object))
    if(p !== "prototype")
      descriptors[p] = Object.getOwnPropertyDescriptor(object, p);
  return descriptors;
}

// Creates a new object containing all the descriptors of properties
// of the given object and its prototype chain.
function getSquashedPrototypeChain(object) {
  let descriptors = {};
  while(object != null) {
    descriptors = Object.assign(getOwnDescriptors(object), descriptors);
    object = Object.getPrototypeOf(object);
  }
  return descriptors;
}

export function mixin(base, mixin) {
  const result = class extends base {
    constructor() {
      super(...arguments);
      mixin.apply(this, arguments);
      //this.__mixinConstuctor.apply(this, arguments);
    }
  };
  const descriptors = getSquashedPrototypeChain(mixin);
  Object.defineProperties(result, descriptors);
  return result;
}
*/

/*
  constructor() {
    this.__mixinConstructor?.apply(this, arguments);
  }

  // We copy property descriptors instead of simply assigning the
  // properties in order to preserve getters/setters.
  findDescriptor = (object, property) ->
    // Walk the prototype chain to find the property descriptor.
    desc = null
    while not desc? and object?
      desc = Object.getOwnPropertyDescriptor(object, property)
      object = Object.getPrototypeOf(object)
    return desc

  // Adds the properties found in mixin to the current class.
  //
  // New properties replace old properties.  A method foo() from the
  // mixin can access the old method with @super.foo().
  //
  // The constructor function is special: The new constructor function
  // is automatically called after the old constructors, similar to a
  // constructor in other languages.
  //
  // For this to work, classes inheriting Extensible must call "super"
  // in their constructor last.
  @mixin: (mixin) ->
    oldSuper = this::super
    this::super = {}
    for key of this.prototype
      desc = findDescriptor this.prototype, key
      if typeof desc.value != "function"
        continue
      do (value = desc.value) =>
        this::super[key] = ->
          // A mixin might call this anonymous function as
          // @super.foo().  We set @super to its old value before
          // calling the previous foo() method.  Because this
          // assignment happens in the context of @super (the call was
          // @super.foo()), we do not need to reset @super after the
          // call.
          @super = oldSuper
          value.apply this, arguments

    // Mix in the new properties.
    for key of mixin.prototype
      if key == "super" or key == "__mixinConstructor"
        throw Error(`Cannot mix in a property with the reserved name "${key}"`)
      Object.defineProperty this::, key, findDescriptor(mixin.prototype, key)

    // Mix in the new static properties.  Exclude private properties.
    for key of mixin when key != "prototype" and key[..1] != "__"
      Object.defineProperty this, key, findDescriptor(mixin, key)

    // The constructor is special.  We want to call the parent
    // constructor without explicitly calling @super.
    if this::__mixinConstructor?
      old = this::__mixinConstructor
      this::__mixinConstructor = ->
        old.apply this, arguments
        mixin::constructor.apply this, arguments
    else
      this::__mixinConstructor = mixin::constructor
    this

  // The same as @mixin, but does not change the current class.
  // Instead it returns a new class with the mixin applied.
  @newTypeWithMixin: (mixin...) ->
    class newType extends this
    newType.mixin i for i in mixin
    newType

  // Adds a property to the prototype.  This property replaces itself
  // by a fresh template instance when accessed for the first time.  In
  // effect, this is a property whose initialization cost (i.e., "new
  // template") you only pay if you access it.
  @injectDelayedProperty: (propName, template) ->
    // Here this refers to the extensible class itself.
    if propName of this::
      throw Error("Property \"#{propName}\" already exists")
    thisPrototype = this::
    Object.defineProperty this::, propName,
      configurable: true
      enumerable: true
      get: ->
        // Avoid accidental instantiation by preventing access except
        // via an instance.
        if this == thisPrototype
          throw Error("This property is only accessible from an instance")
        // Here this refers to an instance of the extensible class.
        Object.defineProperty this, propName,
          configurable: true
          enumerable: true
          writable: true
          // Here this also refers to the instance.
          value: new template(this)
        this[propName]
*/
