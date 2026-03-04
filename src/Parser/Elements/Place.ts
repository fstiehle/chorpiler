import { Transition } from "./Transition.js";
import { Element } from "./Element.js";

export enum PlaceType {
  Flow = 0,
  Start = 1,
  End = 2,
}

export class Place extends Element {
  public source = new Array<Transition>();
  public target = new Array<Transition>();

  constructor(
    id: string,
    public type: PlaceType = PlaceType.Flow,
  ) {
    super(id);
  }
}
