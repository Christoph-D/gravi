/*global $*/
function appendSingleToDom(dom, propertyDescriptor) {
  if(propertyDescriptor.editable === false)
    return;

  const name = propertyDescriptor.name;
  const self = this;
  const form = dom.append("div")
          .attr("class", `property-input ${propertyDescriptor.type}-input`);
  form.append("span")
    .attr("class", "label")
    .text(`${propertyDescriptor.Name}:`);
  switch(propertyDescriptor.type) {
  case "string":
    form.append("span")
      .attr("class", "ui-spinner ui-widget ui-widget-content ui-corner-all")
      .append("input")
      .attr("class", "ui-spinner-input")
      .attr("type", "text")
      .attr("name", name)
      .property("value", this[name])
      .on("input", function() { self[name] = this.value; });
    break;
  case "number":
    const onChange = function() {
      const i = parseInt(this.value);
      if(!isNaN(i))
        self[name] = i;
      else
        self[name] = propertyDescriptor.defaultValue;
    };
    const elem = form.append("input")
            .attr("type", "text")
            .attr("name", name)
            .attr("maxlength", "6")
            .property("value", this[name])
            .on("change", onChange);
    $(elem).spinner({ stop: onChange });
    break;
  case "boolean":
    form.append("input")
      .attr("type", "checkbox")
      .attr("id", name)
      .property("checked", this[name])
      .on("change", function() { self[name] = this.checked; });
    break;
  case "enum":
    for(const n of propertyDescriptor.values) {
      form.append("input")
        .attr("type", "radio")
        .attr("name", `${name}`)
        .attr("id", `${name}-${n}`)
        .attr("value", `${n}`)
        .property("checked", self[name] === n)
        .on("change", function() { self[name] = parseInt(this.value); });
      form.append("label")
        .attr("for", `${name}-${n}`)
        .text(n);
      $(form).buttonset();
    }
    break;
  }
}

export default function appendToDom(dom) {
  this.propertyDescriptors().map(p => Reflect.apply(appendSingleToDom, this, [dom, p]));
}
