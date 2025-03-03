import { Process } from "../Encoding";

export abstract class IFromEncoding {
  static fromEncoding(encoding: Process) { return encoding; };
}