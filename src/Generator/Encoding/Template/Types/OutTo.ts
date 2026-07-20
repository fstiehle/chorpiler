/**
 * Represents a transition target (outTo) in the template encoding.
 * Used for rendering call and sub-choreography transitions.
 *
 * Template expressions used from firing.handlebars.sol:
 * - outTo.call.id: ID of the called/sub choreography
 * - isSub: whether this is a sub-choreography
 * - isCall: whether this is a call-choreography
 * - callString: Solidity code for instantiating the call
 */
export class OutTo {
  constructor(
    public id: string,
    public name: string,
    public isSub: boolean,
    public isCall: boolean,
    public participants: string | null,
  ) {}
}