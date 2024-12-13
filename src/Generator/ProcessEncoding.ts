/**
 * Handles storing the encoding of the process to and from JSON
 * tasks: Map<string, number> Mapping task ID as in BPMN model (string) to task id as in implementation (number)
 * conditions: Map<string, number> Mapping condition name (guard name) as in BPMN model (string) to 
 * condition id as in implementation (number)
 * participants: Map<string, number> Mapping participant ID as in BPMN model (string) to 
 * participant id as in implementation (number)
 */
export class ProcessEncoding {
  constructor(
    public tasks: Map<string, number>,
    public conditions: Map<string, string>,
    public participants: Map<string, number>) { }

  static toJSON(encoding: ProcessEncoding) {
    return {
      tasks: Object.fromEntries(encoding.tasks),
      conditions: Object.fromEntries(encoding.conditions),
      participants: Object.fromEntries(encoding.participants),
    };
  }

  static fromJSON(object: {
    tasks: {
      [k: string]: number;
    };
    conditions: {
      [k: string]: string;
    };
    participants: {
      [k: string]: number;
    };
  }) {
    return new ProcessEncoding(
      new Map(Object.entries(object.tasks)),
      new Map(Object.entries(object.conditions)),
      new Map(Object.entries(object.participants))
    );
  }
}
