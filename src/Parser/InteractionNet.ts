import Participant from "./Participant";
import Place from "./Place";
import { Transition } from "./Transition";

export default class InteractionNet {
  id: string = "";
  participants: Map<string, Participant> = new Map<string, Participant>();
  places: Map<string, Place> = new Map<string, Place>();
  transitions: Map<string, Transition> = new Map<string, Transition>();
  initial: Transition|null = null;
  end: Transition|null = null;
}