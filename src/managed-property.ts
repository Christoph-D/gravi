import Listenable from "./listenable";

export interface PropertyDescriptor {
  defaultValue?: any;
  editable?: boolean;
  enumerable?: boolean;
  getManagedProperty?: () => any;
  name: string;
  Name?: string; // name with a capitalized first letter
  notify?: boolean;
  setManagedProperty?: (val: any) => any;
  shouldBeSaved?: boolean;
  type: "array" | "boolean" | "enum" | "number" | "object" | "string";
  values?: any[];
}

function appendSingleToDom(dom: d3.Selection<any>, propertyDescriptor: PropertyDescriptor) {
  if(propertyDescriptor.editable === false)
    return;

  const name = propertyDescriptor.name;
  const self = this;
  const form = dom.append("div")
    .attr("class", `property-input ${propertyDescriptor.type}-input`);
  form.append("span")
    .attr("class", "label")
    .text(`${propertyDescriptor.Name}:`);
  switch(propertyDescriptor.type) {
  case "string":
    form.append("span")
      .attr("class", "ui-spinner ui-widget ui-widget-content ui-corner-all")
      .append("input")
      .attr("class", "ui-spinner-input")
      .attr("type", "text")
      .attr("name", name)
      .property("value", this[name])
      .on("input", function() { self[name] = this.value; });
    break;
  case "number": {
    const onChange = function() {
      const i = parseInt(this.value, 10);
      if(!isNaN(i))
        self[name] = i;
      else
        self[name] = propertyDescriptor.defaultValue;
    };
    const elem = form.append("input")
            .attr("type", "text")
            .attr("name", name)
            .attr("maxlength", "6")
            .property("value", this[name])
            .on("change", onChange);
    (<any>$(elem)).spinner({ stop: onChange });
    break;
  }
  case "boolean":
    form.append("input")
      .attr("type", "checkbox")
      .attr("id", name)
      .property("checked", this[name])
      .on("change", function() { self[name] = this.checked; });
    break;
  case "enum": {
    for(const n of propertyDescriptor.values!) {
      form.append("input")
        .attr("type", "radio")
        .attr("name", `${name}`)
        .attr("id", `${name}-${n}`)
        .attr("value", `${n}`)
        .property("checked", self[name] === n)
        .on("change", function() { self[name] = parseInt(this.value, 10); });
      form.append("label")
        .attr("for", `${name}-${n}`)
        .text(n);
      (<any>$(form)).buttonset();
    }
    break;
  }
  default: break;
  }
}

function appendToDom(dom: d3.Selection<any>) {
  this.propertyDescriptors().map(p => Reflect.apply(appendSingleToDom, this, [dom, p]));
}

// Adds managed properties to the given class and returns the new
// class.
//
// A managed property is like a property but with several additional
// features: Rudimentary type-checking, change notifications, and
// selectable enumerability.
//
// The properties are implemented with getters/setters.  The actual
// value of a property named "foo" is stored in
// this._properties["foo"].
export default class ManagedPropertiesListenable extends Listenable {
  public static propertyDescriptors: PropertyDescriptor[];
  public static manageProperties(...descriptors: PropertyDescriptor[]) {
    // Check preconditions (no duplicates).
    for(const [i, d] of descriptors.entries()) {
      if(this.propertyDescriptors != null &&
         this.propertyDescriptors.some(p => p.name === d.name))
        throw TypeError(`Managed property "${d.name}" already exists.`);
      if(descriptors.some((e, j) => i !== j && e.name === d.name))
        throw TypeError(`Managed property "${d.name}" cannot be added twice.`);
    }

    // Prepare.
    for(const d of descriptors) {
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
        default: break;
        }
      }
      d.getManagedProperty = function() {
        return (<ManagedPropertiesListenable>this)._properties[d.name];
      };
      d.setManagedProperty = function(value) {
        let self = <ManagedPropertiesListenable>this;
        // Rudimentary type checking.
        const typeofValue = typeof value;
        if(typeofValue !== typeToCheck && typeofValue !== "undefined")
          throw TypeError(`Property "${d.name}" received invalid type "${typeofValue}", expected "${d.type}"`);
        if(isEnum === true && d.values!.indexOf(value) === -1)
          throw TypeError(`Enum property "${d.name}" received invalid value "${value}".  Valid values: ${d.values}`);

        const oldValue = self._properties[d.name];
        self._properties[d.name] = value;

        if(d.notify !== false && oldValue !== value) {
          self.modified = true;
          if(self.dispatch != null)
            self.dispatch(onChange);
        }

        return value;
      };
    }
    // Declare the properties as present.
    if(this.propertyDescriptors != null)
      this.propertyDescriptors = this.propertyDescriptors.slice();
    else
      this.propertyDescriptors = [];
    this.propertyDescriptors.push(...descriptors);
  }

  public appendPropertiesToDom: (dom: d3.Selection<any>) => void;
  public modified: boolean;

  private readonly _properties: { [propName: string]: any };

  constructor(v) {
    super();
    // We want this._properties to be not enumerable.
    Reflect.defineProperty(this, "_properties", {
      configurable: true,
      enumerable: false,
      value: {},
      writable: true,
    });
    for(const d of (<typeof ManagedPropertiesListenable>
                    Reflect.getPrototypeOf(this).constructor).propertyDescriptors) {
      // Define and initialize every property.
      Reflect.defineProperty(this, d.name, {
        configurable: true,
        enumerable: d.enumerable !== false,
        get: d.getManagedProperty,
        set: d.setManagedProperty,
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

  public propertyDescriptors() {
    return (<typeof ManagedPropertiesListenable>
            Reflect.getPrototypeOf(this).constructor).propertyDescriptors;
  }
}
ManagedPropertiesListenable.prototype.appendPropertiesToDom = appendToDom;
