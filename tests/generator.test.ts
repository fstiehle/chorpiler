import { use } from "chai";
import * as fs from 'fs';
import {INetParser, INetFastXMLParser} from "../src/Parser/Parser";
import chaiAsPromised from 'chai-as-promised';
import { SolidityMustache, TemplateEngine } from "../src/Generator/Generator";
import util from 'util';

const readFile = util.promisify(fs.readFile);

use(chaiAsPromised);
describe('Smart Contract Generation', function () {

  describe('compile() with MustacheTemplateEngine', function () {
    let parser: INetParser;
    let generator: TemplateEngine; 

    beforeEach(() => {
      parser = new INetFastXMLParser();
      generator = new SolidityMustache();
    });

    it('compile correct event based XOR', function() {
      readFile(__dirname + '/../src/Generator/templates/Conformance.sol')
      .then((template) => {
        readFile(__dirname + '/bpmn/EventBasedXOR.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            try {
              console.log(generator.compile(iNet, template.toString()));
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