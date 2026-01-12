import { Process } from "./Encoding.js";

export abstract class IFromEncoding {
  static fromEncoding(encoding: Process) {
    return encoding;
  }
}
