import appendToDom from "./listenable-property-dom";

// Adds listenable properties to the given class and returns the new
// class.
//
// The properties are implemented with getters/setters and offer
// rudimentary type checking.  The actual value of a property named
// "foo" is stored in this._properties["foo"].
export default function addListenableProperty(Type, ...descriptors) {
  // Dummy typeof to work around a babel bug.  Without it, _typeof
  // (generated by babel) calls itself in an endless recursion.
  typeof undefined;

  // Check preconditions (no duplicates).
  for(let [i, d] of descriptors.entries()) {
    if(Type.propertyDescriptors != null &&
       Type.propertyDescriptors.some(p => p.name === d.name))
      throw TypeError(`Listenable property "${d.name}" already exists.`);
    if(descriptors.some((e, j) => i !== j && e.name === d.name))
      throw TypeError(`Listenable property "${d.name}" cannot be added twice.`);
  }

  // Prepare.
  for(let d of descriptors) {
    // Name is name with a capitalized first letter.
    d.Name = d.name[0].toUpperCase() + d.name.substr(1);
    // The name of the onChange handler.
    const onChange = `change${d.Name}`;

    let typeToCheck = d.type;
    if(typeToCheck === "array")
      typeToCheck = "object";
    let isEnum = false;
    if(typeToCheck === "enum") {
      typeToCheck = "number";
      isEnum = true;
    }
    if(!("defaultValue" in d)) {
      switch(d.type) {
      case "array": d.defaultValue = []; break;
      case "number": d.defaultValue = 0; break;
      case "string": d.defaultValue = ""; break;
      }
    }
    d.getListenableProperty = function() {
      return this._properties[d.name];
    };
    d.setListenableProperty = function(value) {
      // Rudimentary type checking.
      const typeofValue = typeof value;
      if(typeofValue !== typeToCheck && typeofValue !== "undefined")
        throw TypeError(`Property "${d.name}" received invalid type "${typeofValue}", expected "${d.type}"`);
      if(isEnum === true && d.values.indexOf(value) === -1)
        throw TypeError(`Enum property "${d.name}" received invalid value "${value}".  Valid values: ${d.values}`);

      const oldValue = this._properties[d.name];
      this._properties[d.name] = value;

      if(d.notify !== false && oldValue !== value) {
        this.modified = true;
        if(this.dispatch != null)
          this.dispatch(onChange);
      }

      return value;
    };
  }

  // Define the new type.
  class TypeWithProperty extends Type {
    constructor(v) {
      super(...arguments);
      if(this._properties == null) {
        // We want this._properties to be not enumerable.
        Object.defineProperty(this, "_properties", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: {}
        });
      }
      for(let d of descriptors) {
        // Define and initialize every property.
        Object.defineProperty(this, d.name, {
          configurable: true,
          enumerable: d.enumerable !== false,
          get: d.getListenableProperty,
          set: d.setListenableProperty
        });
        if(v != null && v[d.name] != null) {
          if(d.type === "array")
            this[d.name] = v[d.name].slice();
          else
            this[d.name] = v[d.name];
        }
        else {
          if(d.type === "array")
            this[d.name] = d.defaultValue.slice();
          else
            this[d.name] = d.defaultValue;
        }
      }
    }

    eachProperty(f) {
      this.propertyDescriptors().map(p => f(p));
      return this;
    }

    propertyDescriptors() {
      return TypeWithProperty.propertyDescriptors;
    }
  }
  TypeWithProperty.prototype.appendPropertiesToDom = appendToDom;

  // Declare the properties as present.
  if(TypeWithProperty.propertyDescriptors != null)
    TypeWithProperty.propertyDescriptors = TypeWithProperty.propertyDescriptors.slice();
  else
    TypeWithProperty.propertyDescriptors = [];
  TypeWithProperty.propertyDescriptors.push(...descriptors);

  return TypeWithProperty;
}
