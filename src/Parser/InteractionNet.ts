import Participant from "./Participant";
import Place from "./Place";
import { Transition } from "./Transition";

export default class InteractionNet {
  id: string = "";
  participants: Participant[] = new Array<Participant>;
  places: Place[] = new Array<Place>;
  transitions: Transition[] = new Array<Transition>;
}