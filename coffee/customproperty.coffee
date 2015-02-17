# Adds a property to the given class and returns the new class.
# Contrast with TimedProperty.
addCustomProperty = (Type, descriptor) ->
  name = descriptor.name
  Name = name[0].toUpperCase() + name[1..]

  if descriptor.editable != false
    switch descriptor.type
      when "string", "number"
        descriptor.appendToDom = (dom) ->
          self = this
          dom.append("span").text("#{Name}:").style("margin-right", "1em")
          dom.append("input").attr("type", "text").attr("name", name)
            .property("value", @[name])
            .on("input", -> self[name] = this.value)

  class TypeWithProperty extends Type
    if @propertyDescriptors?
      @propertyDescriptors = (p for p in @propertyDescriptors)
    else
      @propertyDescriptors = []
    for p in @propertyDescriptors
      if p.name == name
        throw TypeError("Custom property \"#{name}\" already exists.")
    @propertyDescriptors.push(descriptor)

    constructor: (v) ->
      super
      if not @_properties?
        Object.defineProperty this, '_properties',
          configurable: true
          enumerable: false
          writable: true
          value: {}
      Object.defineProperty this, name,
        configurable: true
        enumerable: descriptor.enumerable != false
        get: => @_properties[name]
        set: (value) =>
          @_properties[name] = value
          @["onChange#{Name}"]?()
          value
      if descriptor.pretty?
        Object.defineProperty this, "pretty#{Name}",
          configurable: true
          enumerable: false
          value: => descriptor.pretty @[name]
      if v?[name]?
        if descriptor.type == "array"
          @_properties[name] = v[name].slice()
        else
          @_properties[name] = v[name]
      else
        if descriptor.type == "array"
          @_properties[name] = []
        else
          @_properties[name] = descriptor.value

    eachProperty: (f) -> f p for p in @propertyDescriptors()
    propertyDescriptors: -> TypeWithProperty.propertyDescriptors

    appendPropertiesToDom: (dom) ->
      @eachProperty (p) => p.appendToDom?.call this, dom
