class Extensible
  constructor: -> @mixinConstructor?()

  # Adds the properties found in mixin to the current class.
  #
  # New properties replace old properties.  The constructor function
  # is special: The new constructor function is called after the old
  # one, similar to a constructor in other languages.
  #
  # For this to work, derivative classes must call "super" in their
  # constructor last.
  @mixin: (mixin) ->
    this::[key] = value for own key, value of mixin when key != "constructor"
    if this::mixinConstructor?
      old = this::mixinConstructor
      this::mixinConstructor = ->
        old.call this
        mixin.constructor.call this
    else
      this::mixinConstructor = mixin.constructor
    this
  # The same as @mixin, but does not change the current class.
  # Instead it returns a new class with the mixin applied.
  @newTypeWithMixin: (mixin...) ->
    class newType extends this
    newType.mixin i for i in mixin
    newType
