appendToDom = (dom, propertyDescriptor) ->
  if propertyDescriptor.editable == false
    return

  name = propertyDescriptor.name
  Name = propertyDescriptor.Name
  switch propertyDescriptor.type
    when "string"
      self = this
      dom = dom.append("p")
      dom.append("span").text("#{Name}:").style("margin-right", "1em")
      dom.append("input").attr("type", "text").attr("name", name)
        .property("value", @[name])
        .on("input", -> self[name] = this.value)
    when "number"
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
            self[name] = propertyDescriptor.defaultValue)
    when "boolean"
      self = this
      dom = dom.append("p")
      dom.append("label").text("#{Name}:").attr("for", name)
      dom.append("input").attr("type", "checkbox").attr("id", name)
        .property("checked", @[name])
        .on("change", -> self[name] = this.checked)
    when "enum"
      self = this
      values = propertyDescriptor.values
      if values.length != 2
        throw Error("Don't know how to display non-boolean enums")
      dom = dom.append("p")
      dom.append("span").text("#{Name}:").style("margin-right", "1em")
      dom.append("input").attr("type", "text").attr("name", name)
        .property("value", @[name])
        .on("input", ->
          i = parseInt this.value
          try
            self[name] = i
          catch
            self[name] = propertyDescriptor.defaultValue)
  return

return (dom) ->
  @eachProperty (p) => appendToDom.call this, dom, p
