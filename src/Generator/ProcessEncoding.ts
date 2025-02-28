/**
 * Handles storing the encoding of the process to and from JSON
 * tasks: Map<string, number> Mapping task ID as in BPMN model (string) to task id as in implementation (number)
 * conditions: Map<string, number> Mapping condition name (guard name) as in BPMN model (string) to 
 * condition id as in implementation (number)
 * participants: Map<string, number> Mapping participant ID as in BPMN model (string) to 
 * participant id as in implementation (number)
 */
export class SubProcessEncoding {
  constructor(
    public id: number,
    public tasks: Map<string, number>
  ) {}

  static toJSON(subProcess: SubProcessEncoding) {
    return {
      id: subProcess.id,
      tasks: Object.fromEntries(subProcess.tasks),
    };
  }

  static fromJSON(object: { id: number; tasks: { [k: string]: number } }) {
    return new SubProcessEncoding(object.id, new Map(Object.entries(object.tasks)));
  }
}

export class ProcessEncoding {
  subModels: Map<string, SubProcessEncoding> | null = null;

  constructor(
    public tasks: Map<string, number>,
    public participants: Map<string, number>,
    _subModels?: Map<string, SubProcessEncoding>
  ) {
    if (_subModels) this.subModels = _subModels;
  }

  static toJSON(encoding: ProcessEncoding) {
    return {
      tasks: Object.fromEntries(encoding.tasks),
      participants: Object.fromEntries(encoding.participants),
      subModels: encoding.subModels
        ? Object.fromEntries(
            [...encoding.subModels].map(([key, subProcess]) => [
              key,
              SubProcessEncoding.toJSON(subProcess),
            ])
          )
        : undefined,
    };
  }

  static fromJSON(object: {
    tasks: { [k: string]: number };
    participants: { [k: string]: number };
    subModels?: { [k: string]: { id: number; tasks: { [k: string]: number } } };
  }) {
    return new ProcessEncoding(
      new Map(Object.entries(object.tasks)),
      new Map(Object.entries(object.participants)),
      object.subModels
        ? new Map(
            Object.entries(object.subModels).map(([key, subProcess]) => [
              key,
              SubProcessEncoding.fromJSON(subProcess),
            ])
          )
        : undefined
    );
  }
}