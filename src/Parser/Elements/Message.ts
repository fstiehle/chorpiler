import { Transition } from "./Transition.js";

export class Message {
  constructor(
    public modelID: string,
    public label: string | undefined,
    public linkedTransition: Transition | null = null,
  ) {}
}
