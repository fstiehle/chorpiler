import { CaseVariable } from "../../Generator/Encoding/Encoding.js";

export class Message {
  constructor(
    public modelID: string,
    public label: string | undefined,
    public caseVariable: CaseVariable | null = null,
  ) {}
}
