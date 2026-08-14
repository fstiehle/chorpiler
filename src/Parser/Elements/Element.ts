export class Element {
  public source = new Array<Element>();
  public target = new Array<Element>();

  constructor(public id: string) {}
}
