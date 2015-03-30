# Adds a property to the given class and returns the new class.
# Contrast with TimedProperty.
return add: (Type, descriptor) ->
  name = descriptor.name
  Name = name[0].toUpperCase() + name[1..]
  onChange = "onChange#{Name}"
  typeToCheck = descriptor.type
  if typeToCheck == 'array'
    typeToCheck = 'object'

  if descriptor.editable != false
    switch descriptor.type
      when "string"
        descriptor.appendToDom = (dom) ->
          self = this
          dom = dom.append("p")
          dom.append("span").text("#{Name}:").style("margin-right", "1em")
          dom.append("input").attr("type", "text").attr("name", name)
            .property("value", @[name])
            .on("input", -> self[name] = this.value)
      when "number"
        descriptor.appendToDom = (dom) ->
          self = this
          dom = dom.append("p")
          dom.append("span").text("#{Name}:").style("margin-right", "1em")
          dom.append("input").attr("type", "text").attr("name", name)
            .property("value", @[name])
            .on("input", ->
              i = parseInt this.value
              if not isNaN(i)
                self[name] = i
              else
                self[name] = descriptor.defaultValue)
      when "boolean"
        descriptor.appendToDom = (dom) ->
          self = this
          dom = dom.append("p")
          dom.append("label").text("#{Name}:").attr("for", name)
          dom.append("input").attr("type", "checkbox").attr("id", name)
            .property("checked", @[name])
            .on("change", -> self[name] = this.checked)

  class TypeWithProperty extends Type
    if @propertyDescriptors?
      @propertyDescriptors = @propertyDescriptors.slice()
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
        get: -> @_properties[name]
        set: (value) ->
          if typeof value != typeToCheck and typeof value != 'undefined'
            throw TypeError("Property \"#{name}\" received invalid type \"#{typeof value}\", \
              excepted \"#{descriptor.type}\"")
          @_properties[name] = value
          @modified = true
          @[onChange]?()
          value
      if v?[name]?
        if descriptor.type == "array"
          @[name] = v[name].slice()
        else
          @[name] = v[name]
      else
        if descriptor.type == "array"
          @[name] = []
        else
          @[name] = descriptor.defaultValue

    eachProperty: (f) ->
      for p in @propertyDescriptors()
        f p
      @
    propertyDescriptors: -> TypeWithProperty.propertyDescriptors

    appendPropertiesToDom: (dom) ->
      @eachProperty (p) => p.appendToDom?.call this, dom
