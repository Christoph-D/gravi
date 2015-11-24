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
  }

  Object.defineProperty(TypeWithProperty, name, {
    configurable: true,
    enumerable: descriptor.enumerable != false,
    get: () => this._properties[name],
    set: (value) => {
      if(typeof value !== typeToCheck && typeof value !== "undefined")
        throw TypeError(`Property "${name}" received invalid type "${typeof value}", \
            excepted "${descriptor.type}"`);
      if(isEnum === true && !(value in descriptor.values))
        throw TypeError(`Enum property "${name}" received invalid value "${value}"`);
      const oldValue = this._properties[name];
      this._properties[name] = value;
      if(descriptor.notify !== false && oldValue !== value)
        this.modified = true;
      if(this.dispatch != null)
        this.dispatch(onChange);
      return value;
    }
  });

  if(TypeWithProperty.propertyDescriptors != null)
    TypeWithProperty.propertyDescriptors = TypeWithProperty.propertyDescriptors.slice();
  else
    TypeWithProperty.propertyDescriptors = [];
  if(TypeWithProperty.propertyDescriptors.some(p => p.name === name))
    throw TypeError(`Custom property "${name}" already exists.`);
  TypeWithProperty.propertyDescriptors.push(descriptor);
}

export function addMany(Type, descriptors) {
  for(let d of descriptors)
    Type = add(Type, d);
  return Type;
}
