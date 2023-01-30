import { use } from "chai";
import * as fs from 'fs';
import {INetParser, INetFastXMLParser} from "../src/Parser/Parser";
import chaiAsPromised from 'chai-as-promised';
import { SolidityConformance, TemplateEngine } from "../src/Generator/Sol/Conformance";
import util from 'util';
import { SolidityStateChannelRoot } from "../src/Generator/Sol/StateChannelRoot";

const readFile = util.promisify(fs.readFile);

use(chaiAsPromised);
describe('Smart Contract Generation', function () {

  describe('compile() with MustacheTemplateEngine', function () {
    let parser: INetParser;
    let conformanceGenerator: TemplateEngine; 
    let stateChannelRootGenerator: TemplateEngine; 

    beforeEach(() => {
      parser = new INetFastXMLParser();
      conformanceGenerator = new SolidityConformance();
      stateChannelRootGenerator = new SolidityStateChannelRoot();
    });

    it('compile correct event based XOR to Conformance Contract', function() {
      readFile(__dirname + '/../src/Generator/Sol/templates/Conformance.sol')
      .then((template) => {
        readFile(__dirname + '/bpmn/EventBasedXOR.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            try {
              console.log(conformanceGenerator.compile(iNet, template.toString()));
            } catch (error) {
              console.log(error);
            }
          })
        })
      })
      .catch((error) => {
        console.error(error);
      });
    });

    it('compile correct event based XOR to StateChannelRoot Contract', function() {
      readFile(__dirname + '/../src/Generator/Sol/templates/StateChannelRoot.sol')
      .then((template) => {
        readFile(__dirname + '/bpmn/EventBasedXOR.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            try {
              console.log(stateChannelRootGenerator.compile(iNet, template.toString()));
            } catch (error) {
              console.log(error);
            }
          })
        })
      })
      .catch((error) => {
        console.error(error);
      });
    });
  });
});