import * as Encoding from "../Encoding.js";
import { CallType } from "../../../Parser/Elements/Call.js";

export class TransitionTarget {
  public isCall = false;
  public isSub = false;
  public callString: string | undefined = undefined;

  constructor(public call: Encoding.Call) {
    this.isCall = isCallChoreography(call);
    this.isSub = isSubChoreography(call);

    // Generate Solidity call string for call targets
    if (this.isCall) {
      if (call && call.participants) {
        const participantIds = call.participants
          .map((p) => `participants[${p.id}]`)
          .join(", ");
        this.callString = `instanceList[${call.id}] = ${call.name}.instance([${participantIds}]);`;
      }
    }
  }
}

function isCallChoreography(call: Encoding.Call): boolean {
  return call?.type === CallType.CallChoreography;
}

function isSubChoreography(call: Encoding.Call): boolean {
  return call?.type === CallType.SubChoreography;
}