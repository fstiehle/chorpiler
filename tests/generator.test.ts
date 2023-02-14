import { use } from "chai";
import * as fs from 'fs';
import {INetParser, INetFastXMLParser} from "../src/Parser/Parser";
import chaiAsPromised from 'chai-as-promised';
import util from 'util';
import { SolidityStateChannelRoot } from "../src/Generator/target/Sol/StateChannelRoot";
import TemplateEngine from "../src/Generator/TemplateEngine";
import SolidityEnactment from "../src/Generator/target/Sol/ProcessEnactment";
import TypescriptEnactment from "../src/Generator/target/Typescript/ProcessEnactment";

const readFile = util.promisify(fs.readFile);

use(chaiAsPromised);
describe('Smart Contract Generation', function () {

  describe('compile() with MustacheTemplateEngine', function () {
    let parser: INetParser;
    let solGenerator: TemplateEngine; 
    let tsGenerator: TemplateEngine; 
    let stateChannelRootGenerator: TemplateEngine; 

    beforeEach(() => {
      parser = new INetFastXMLParser();
      solGenerator = new SolidityEnactment();
      tsGenerator = new TypescriptEnactment();
      stateChannelRootGenerator = new SolidityStateChannelRoot();
    });

    it('Using default template: compile correct event based XOR to Sol Contract', function() {
      readFile(__dirname + '/bpmn/EventBasedXOR.bpmn')
      .then((data) => {
        parser.fromXML(data).then((iNet) => {
          solGenerator.compile(iNet).then(r => console.log(r)).catch(error => console.log(error));
        })
      })
      .catch((error) => {
        console.error(error);
      });
    });

    it('Using default template: compile correct event based XOR to typescript', function() {
      readFile(__dirname + '/bpmn/EventBasedXOR.bpmn')
      .then((data) => {
        parser.fromXML(data).then((iNet) => {
          tsGenerator.compile(iNet).then(r => console.log(r)).catch(error => console.log(error));
        })
      })
      .catch((error) => {
        console.error(error);
      });
    });

    it('compile correct event based XOR to Sol Contract', function() {
      readFile('./src/Generator/templates/Process.sol')
      .then((template) => {
        readFile(__dirname + '/bpmn/EventBasedXOR.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            solGenerator.compile(iNet, template.toString()).then(r => console.log(r)).catch(error => console.log(error));
          })
        })
      })
      .catch((error) => {
        console.error(error);
      });
    });

    it('compile correct event based XOR to StateChannelRoot Contract', function() {
      readFile('./src/Generator/templates/StateChannelRoot.sol')
      .then((template) => {
        readFile(__dirname + '/bpmn/EventBasedXOR.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            stateChannelRootGenerator.compile(iNet, template.toString()).then(r => console.log(r)).catch(error => console.log(error));
          })
        })
      })
      .catch((error) => {
        console.error(error);
      });
    });
  });
});