import { Participant } from "./Elements/Participant.js";
import { Place } from "./Elements/Place.js";
import { Element } from "./Elements/Element.js";
import { Message } from "./Elements/Message.js";

export class InteractionNet {
  id: string = "";
  isCalled: boolean = false; // called by other choreography?
  callList = new Map<string, InteractionNet>(); // calling other choreograhphies?
  subNets = new Map<string, InteractionNet>();
  participants = new Map<string, Participant>();
  namedMessages = new Map<string, Message>();
  elements = new Map<string, Element>();
  initial: Place | null = null;
  end: Place | null = null;
}
