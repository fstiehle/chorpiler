import { expect, use } from "chai";
import util from 'util';
import * as fs from 'fs';
import {INetParser, INetFastXMLParser} from "../../src/Parser/Parser";
import chaiAsPromised from 'chai-as-promised';

const readFile = util.promisify(fs.readFile);
use(chaiAsPromised);

// Test Parsing works with all supported elements 
// and parser reports unsupported elements
describe('Test BPMN choreography parsing', function () {
  
  describe('Parse with FastXMLParser', function () {
    let parser: INetParser;

    beforeEach(() => {
      parser = new INetFastXMLParser();
    })

    it('Parse model with XOR', function() {
      return expect(readFile(__dirname + '/bpmn/XOR.bpmn')
        .then((data) => {
          parser.fromXML(data);
        })
      ).to.be.eventually.fulfilled;
    });

    it('Parse model with call choreography and report missing support', function() {
      return expect(readFile(__dirname + '/bpmn/call-choreography.bpmn')
        .then((data) => {
          return parser.fromXML(data);
        })
      ).to.be.eventually.rejectedWith("Unsupported Element");
    });

    it('Parse malformed model an report error', function() {
      return expect(readFile(__dirname + '/bpmn/malformed.bpmn')
        .then((data) => {
          return parser.fromXML(data);
        })
      ).to.be.eventually.rejected;
    });
  });
});