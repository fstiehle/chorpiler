import { Participant } from "./Participant";
import { Element, Place } from "./Element";

export class InteractionNet {
  id: string = "";
  subNets = new Map<string, InteractionNet>();
  participants = new Map<string, Participant>();
  elements = new Map<string, Element>();
  initial: Place|null = null;
  end: Place|null = null;
}