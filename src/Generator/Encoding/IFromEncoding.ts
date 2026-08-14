import { MainProcess, Process } from "./Encoding.js";

export abstract class IFromEncoding {
  static fromEncoding(encoding: MainProcess) {
    return encoding;
  }
}
