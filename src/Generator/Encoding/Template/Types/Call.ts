import type * as Encoding from "../Encoding.js";

/**
 * Represents a called contract in the template encoding.
 * Used for rendering interface declarations and contract references.
 */
export class Call {
  constructor(
    public name: string,
    public address: string,
    public numberOfParticipants: string,
  ) {}

  /**
   * Creates a Call instance from an Encoding.Call.
   */
  static fromEncoding(call: Encoding.Call): Call {
    return new Call(
      call.name,
      call.address,
      call.numberOfParticipants.toString()
    );
  }
}