import { expect, use } from "chai";
import { readFileSync } from 'fs';
import path from "path";
import { BPMN_PATH } from "../../config";
import { Simulator } from "../../../src/Simulator/Simulator"; // Adjust the path as needed
import { XESFastXMLParser } from "../../../src/util/EventLog/XESFastXMLParser";
import { INetFastXMLParser } from "../../../src/Parser/FastXMLParser";
import { disperseCaseDataInLog } from "../../../src/util/EventLog/utils";

describe('Simulate...', () => {

  const sim = new Simulator();

  it("decorate log", () => {
    return sim.prepare()
  })

})