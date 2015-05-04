appendToDom = (dom, propertyDescriptor) ->
  if propertyDescriptor.editable == false
    return

  name = propertyDescriptor.name
  self = this
  form = dom.append("form").attr("class", "property-input #{propertyDescriptor.type}-input")
  form.append("span")
    .attr("class", "label")
    .text("#{propertyDescriptor.Name}:")
  switch propertyDescriptor.type
    when "string"
      form.append("span")
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
      elem = form.append("input")
        .attr("type", "text")
        .attr("name", name)
        .attr("maxlength", "6")
        .property("value", @[name])
        .on("change", onChange)
      $(elem).spinner(stop: onChange)
    when "boolean"
      form.append("input")
        .attr("type", "checkbox")
        .attr("id", name)
        .property("checked", @[name])
        .on("change", -> self[name] = this.checked)
    when "enum"
      for n in propertyDescriptor.values
        form.append("input")
          .attr("type", "radio")
          .attr("name", "#{name}")
          .attr("id", "#{name}-#{n}")
          .attr("value", "#{n}")
          .property("checked", self[name] == n)
          .on("change", -> self[name] = parseInt(this.value))
        form.append("label")
          .attr("for", "#{name}-#{n}")
          .text(n)
      $(form).buttonset()
  return

return (dom) ->
  @eachProperty (p) => appendToDom.call this, dom, p
