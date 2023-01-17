import Participant from "./Participant";
import { Element, Place } from "./Element";

export default class InteractionNet {
  id: string = "";
  participants = new Map<string, Participant>();
  elements = new Map<string, Element>();
  initial: Place|null = null;
  end: Place|null = null;
}