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
        value: new template(this)
      });
      return this[propName];
    }
  });
}
