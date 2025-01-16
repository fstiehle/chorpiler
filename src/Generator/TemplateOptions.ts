
export class TemplateOptions {
  // note: number = 0 is interpreted as false value
  // and may not be displayed by the template engine, 
  // thus, prefer string type
  numberOfParticipants = "0";
  caseVariables = new Array<{
    name: string,
    type: string,
    expression: string,
    setters: boolean
  }>();
  participants = new Array<{
    id: string; // ID in form 0...n assigned by generator
    modelID: string; // ID as in model
    name: string;
    address: string;
  }>();

  manualTransitions = new Array<{
    id: string;
    initiator: string | null;
    consume: string;
    produce: string;
    condition: string;
    isEnd: boolean;
  }>();

  autonomousTransitions = Array<{
    id: string | null;
    consume: string;
    produce: string;
    condition: string;
    isEnd: boolean;
  }>();

  hasConditions = false;
  hasManualTransitions = false;
  hasAutonomousTransitions = false;
}
