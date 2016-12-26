import ManagedPropertiesListenable from "managed-property";

export default class InfoColumn {
  private dom: any;

  public constructor(dom) {
    this.dom = dom;
  }

  public addBox(boxName: string, content: ManagedPropertiesListenable) {
    this.dom.style("display", "block");
    const box = this.findBox(boxName);
    box.selectAll("*").remove();
    content.appendPropertiesToDom(box);
  }

  public removeBox(boxName: string) {
    this.dom.select(`.${boxName}`).remove();
    if(this.dom.selectAll("div").size() === 0)
      this.dom.style("display", "none");
  }

  private findBox(boxName: string): any {
    const x = this.dom.select(`.${boxName}`);
    if(x.size() !== 0)
      return x;
    return this.dom.append("div").attr("class", `${boxName}`);
  }
};
