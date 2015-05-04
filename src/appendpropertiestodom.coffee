appendToDom = (dom, propertyDescriptor) ->
  if propertyDescriptor.editable == false
    return

  name = propertyDescriptor.name
  self = this
  div = dom.append("form").attr("class", "property-input #{propertyDescriptor.type}-input").append("div")
  div.append("span")
    .attr("class", "label")
    .text("#{propertyDescriptor.Name}:")
  switch propertyDescriptor.type
    when "string"
      div.append("span")
        .attr("class", "ui-spinner ui-widget ui-widget-content ui-corner-all")
        .append("input")
        .attr("class", "ui-spinner-input")
        .attr("type", "text")
        .attr("name", name)
        .property("value", @[name])
        .on("input", -> self[name] = this.value)
    when "number"
      onChange = ->
        i = parseInt this.value
        if not isNaN(i)
          self[name] = i
        else
          self[name] = propertyDescriptor.defaultValue
      elem = div.append("input")
        .attr("type", "text")
        .attr("name", name)
        .property("value", @[name])
        .on("change", onChange)
      $(elem).spinner(stop: onChange)
    when "boolean"
      div.append("input")
        .attr("type", "checkbox")
        .attr("id", name)
        .property("checked", @[name])
        .on("change", -> self[name] = this.checked)
    when "enum"
      for n in propertyDescriptor.values
        div.append("input")
          .attr("type", "radio")
          .attr("name", "#{name}")
          .attr("id", "#{name}-#{n}")
          .attr("value", "#{n}")
          .property("checked", self[name] == n)
          .on("change", -> self[name] = parseInt(this.value))
        div.append("label")
          .attr("for", "#{name}-#{n}")
          .text(n)
      $(div).buttonset()
  return

return (dom) ->
  @eachProperty (p) => appendToDom.call this, dom, p
