class Extensible
  constructor: -> @__mixinConstructor?.apply this, arguments

  # Adds the properties found in mixin to the current class.
  #
  # New properties replace old properties.  A method foo() from the
  # mixin can access the old method with @super.foo().
  #
  # The constructor function is special: The new constructor function
  # is automatically called after the old constructors, similar to a
  # constructor in other languages.
  #
  # For this to work, classes inheriting Extensible must call "super"
  # in their constructor last.
  @mixin: (mixin) ->
    # If mixin::foo calls @super.foo(), then foo() will be called in
    # the context of @super.  So @super needs again a property named
    # super.
    if this::super?
      this::super = Object.create(this::super)
    else
      this::super = {}
      # Create a circular reference to allow super.super.super...
      this::super.super = this::super

    # Copy all currently existing methods into super.
    for key, value of this.prototype when typeof value == "function"
      this::super[key] = value

    # Mix in the new properties.
    for key, value of mixin.prototype
      if key == "super" or key == "__mixinConstructor"
        throw Error("Cannot mix in a property with the reserved name \"#{key}\".")
      this::[key] = value

    # Mix in the new static properties.
    for key, value of mixin when key != "prototype"
      this[key] = value

    # The constructor is special.  We want to call the parent
    # constructor without explicitly calling @super.
    if this::__mixinConstructor?
      old = this::__mixinConstructor
      this::__mixinConstructor = ->
        old.apply this, arguments
        mixin::constructor.apply this, arguments
    else
      this::__mixinConstructor = mixin::constructor
    this

  # The same as @mixin, but does not change the current class.
  # Instead it returns a new class with the mixin applied.
  @newTypeWithMixin: (mixin...) ->
    class newType extends this
    newType.mixin i for i in mixin
    newType
