import appendToDom from "./appendpropertiestodom";

// Adds a property to the given class and returns the new class.
// Contrast with TimedProperty.
export function add(Type, descriptor) {
  const name = descriptor.name;
  // name with a capitalized first letter.
  descriptor.Name = name[0].toUpperCase() + name.substr(1);
  const onChange = `change${descriptor.Name}`;
  let typeToCheck = descriptor.type;
  if(typeToCheck === "array")
    typeToCheck = "object";
  let isEnum = false;
  if(typeToCheck === "enum") {
    typeToCheck = "number";
    isEnum = true;
  }

  if(!("defaultValue" in descriptor)) {
    switch(descriptor.type) {
    case "array": descriptor.defaultValue = []; break;
    case "number": descriptor.defaultValue = 0; break;
    case "string": descriptor.defaultValue = ""; break;
    }
  }

  const getCustomProperty = function() {
    return this._properties[name];
  };
  const setCustomProperty = function(value) {
    if(typeof value !== typeToCheck && typeof value !== "undefined")
      throw TypeError(`Property "${name}" received invalid type "${typeof value}", expected "${descriptor.type}"`);
    if(isEnum === true && !(value in descriptor.values))
      throw TypeError(`Enum property "${name}" received invalid value "${value}".  Valid values: ${descriptor.values}`);
    const oldValue = this._properties[name];
    this._properties[name] = value;
    if(descriptor.notify !== false && oldValue !== value)
      this.modified = true;
    if(this.dispatch != null)
      this.dispatch(onChange);
    return value;
  };

  const TypeWithProperty = class extends Type {
    constructor(v) {
      super(...arguments);
      Object.defineProperty(this, name, {
        configurable: true,
        enumerable: descriptor.enumerable !== false,
        get: getCustomProperty,
        set: setCustomProperty
      });
      if(this._properties == null) {
        // We want this._properties to be not enumerable.
        Object.defineProperty(this, "_properties", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: {}
        });
      }
      if(v != null && v[name] != null) {
        if(descriptor.type === "array")
          this[name] = v[name].slice();
        else
          this[name] = v[name];
      }
      else {
        if(descriptor.type === "array")
          this[name] = descriptor.defaultValue.slice();
        else
          this[name] = descriptor.defaultValue;
      }
    }

    eachProperty(f) {
      this.propertyDescriptors().map(p => f(p));
      return this;
    }

    propertyDescriptors() {
      return TypeWithProperty.propertyDescriptors;
    }

    appendPropertiesToDom() {
      appendToDom();
    }
  };

  if(TypeWithProperty.propertyDescriptors != null)
    TypeWithProperty.propertyDescriptors = TypeWithProperty.propertyDescriptors.slice();
  else
    TypeWithProperty.propertyDescriptors = [];
  if(TypeWithProperty.propertyDescriptors.some(p => p.name === name))
    throw TypeError(`Custom property "${name}" already exists.`);
  TypeWithProperty.propertyDescriptors.push(descriptor);

  return TypeWithProperty;
}

export function addMany(Type, descriptors) {
  for(let d of descriptors)
    Type = add(Type, d);
  return Type;
}
