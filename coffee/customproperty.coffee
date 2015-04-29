# Adds a property to the given class and returns the new class.
# Contrast with TimedProperty.
add = (Type, descriptor) ->
  name = descriptor.name
  # name with a capitalized first letter.
  descriptor.Name = name[0].toUpperCase() + name[1..]
  onChange = "onChange#{descriptor.Name}"
  typeToCheck = descriptor.type
  if typeToCheck == "array"
    typeToCheck = "object"

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
        Object.defineProperty this, "_properties",
          configurable: true
          enumerable: false
          writable: true
          value: {}
      Object.defineProperty this, name,
        configurable: true
        enumerable: descriptor.enumerable != false
        get: -> @_properties[name]
        set: (value) ->
          if typeof value != typeToCheck and typeof value != "undefined"
            throw TypeError("Property \"#{name}\" received invalid type \"#{typeof value}\", \
              excepted \"#{descriptor.type}\"")
          oldValue = @_properties[name]
          @_properties[name] = value
          if descriptor.notify != false and oldValue != value
            @modified = true
            @dispatch?(onChange)
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

    appendPropertiesToDom: require "./appendpropertiestodom"

addMany = (Type, descriptors) ->
  for d in descriptors
    Type = add(Type, d)
  Type

return add: add, addMany: addMany
