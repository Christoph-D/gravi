appendToDom = (dom, propertyDescriptor) ->
  if propertyDescriptor.editable == false
    return

  name = propertyDescriptor.name
  Name = propertyDescriptor.Name
  switch propertyDescriptor.type
    when "string"
      self = this
      dom = dom.append("p").attr("class", "property-input string-input")
      dom.append("span")
        .attr("class", "label")
        .text("#{Name}:")
      span = dom.append("span").classed("ui-spinner ui-widget ui-widget-content ui-corner-all", true)
      span.append("input").attr("type", "text").attr("name", name)
        .property("value", @[name])
        .on("input", -> self[name] = this.value)
        .classed("ui-spinner-input", true)
    when "number"
      self = this
      dom = dom.append("p").attr("class", "property-input number-input")
      dom.append("span")
        .attr("class", "label")
        .text("#{Name}:")
      onChange = ->
        i = parseInt this.value
        if not isNaN(i)
          self[name] = i
        else
          self[name] = propertyDescriptor.defaultValue
      elem = dom.append("input").attr("type", "text").attr("name", name)
        .property("value", @[name])
        .on("change", onChange)
      $(elem).spinner(stop: onChange)
    when "boolean"
      self = this
      dom = dom.append("p").attr("class", "property-input boolean-input")
      div.append("label")
        .attr("class", "label")
        .text("#{Name}:")
        .attr("for", name)
      dom.append("input").attr("type", "checkbox").attr("id", name)
        .property("checked", @[name])
        .on("change", -> self[name] = this.checked)
    when "enum"
      self = this
      values = propertyDescriptor.values
      div = dom.append("form").attr("class", "property-input enum-input").append("div")
      div.append("span")
        .attr("class", "label")
        .text("#{Name}:")
      appendChoice = (n) ->
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
      for v in values
        appendChoice(v)
      $(div).buttonset()
  return

return (dom) ->
  @eachProperty (p) => appendToDom.call this, dom, p
