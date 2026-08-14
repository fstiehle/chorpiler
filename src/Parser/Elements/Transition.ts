import { Call } from "./Call.js";
import { Place } from "./Place.js";
import { Label } from "./Label.js";
import { Element } from "./Element.js";

export class Transition extends Element {
  source = new Array<Place>();
  target = new Array<Place>();
  calls = new Array<Call>(); // calls another choreography

  constructor(
    id: string,
    public label: Label,
  ) {
    super(id);
  }
}
