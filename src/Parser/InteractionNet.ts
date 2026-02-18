import { Participant } from "./Participant.js";
import { Element, Place } from "./Element.js";

export class InteractionNet {
  id: string = "";
  isCalled: boolean = false; // called by other choreography?
  callList = new Map<string, InteractionNet>(); // calling other choreograhphies?
  subNets = new Map<string, InteractionNet>();
  participants = new Map<string, Participant>();
  elements = new Map<string, Element>();
  initial: Place | null = null;
  end: Place | null = null;
}
