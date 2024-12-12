import { expect, use } from "chai";
import util from 'util';
import * as fs from 'fs';
import {INetParser} from "../../src/Parser/Parser";
import chaiAsPromised from 'chai-as-promised';
import path from "path";
import { BPMN_PATH } from "../config";
import { INetFastXMLParser } from "../../src/Parser/FastXMLParser";

const readFile = util.promisify(fs.readFile);
use(chaiAsPromised);

// Test Parsing works with all supported elements 
// and parser reports unsupported elements
describe('Test BPMN choreography parsing', () => {
  
  describe('Parse with FastXMLParser', () => {
    let parser: INetParser;

    beforeEach(() => {
      parser = new INetFastXMLParser();
    })

    it('Parse model with XOR', () => {
      return readFile(path.join(BPMN_PATH, 'xor.bpmn'))
        .then((data) => {
          return parser.fromXML(data);
      });
    });

    it('Parse model with AND', () => {
      return readFile(path.join(BPMN_PATH, 'and.bpmn'))
        .then((data) => {
          return parser.fromXML(data);
      });
    });

    it('Parse model with XOR Skip', () => {
      return readFile(path.join(BPMN_PATH, 'xor-skip.bpmn'))
        .then((data) => {
          return parser.fromXML(data);
      });
    });

    it('Parse model with call choreography and report missing support', () => {
      return expect(readFile(path.join(BPMN_PATH, 'call-choreography.bpmn'))
        .then((data) => {
          return parser.fromXML(data);
      }))
      .to.be.eventually.rejectedWith("Unsupported Element");
    });

    it('Parse malformed model an report error', () => {
      return expect(readFile(path.join(BPMN_PATH, 'malformed.bpmn'))
        .then((data) => {
          return parser.fromXML(data);
      }))
      .to.be.eventually.rejected;
    });

    it('Parse model with XOR with missing default sequence flow and report error', () => {
      return expect(readFile(path.join(BPMN_PATH, 'xor-nodefault.bpmn'))
        .then((data) => {
          return parser.fromXML(data);
      }))
      .to.be.eventually.rejected;
    });

  });
});