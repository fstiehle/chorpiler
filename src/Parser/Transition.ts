import Participant from "./Participant";
import Place from "./Place";

export class Transition {
  label: Label;
  in: Place[] = new Array<Place>;
  out: Place[] = new Array<Place>;

  constructor(label: Label) {
    this.label = label;
  }
}

export class Label {
  sender: Participant
  receiver: Participant

  constructor(sender: Participant, receiver: Participant) {
    this.sender = sender;
    this.receiver = receiver;
  }
}