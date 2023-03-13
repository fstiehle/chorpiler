import { use } from "chai";
import * as fs from 'fs';
import {INetParser, INetFastXMLParser} from "../../src/Parser/Parser";
import chaiAsPromised from 'chai-as-promised';
import util from 'util';
import SolidityProcessChannel from "../../src/Generator/target/Sol/SolProcessChannel";
import SolidityProcessEnactment from "../../src/Generator/target/Sol/SolProcessEnactment";
import TypeScriptEnactFunc from "../../src/Generator/target/Typescript/TsProcessEnactFunc";

import TemplateEngine from "../../src/Generator/TemplateEngine";
import path from "path";

const readFile = util.promisify(fs.readFile);

use(chaiAsPromised);
describe('Smart Contract Generation', function () {

  let parser: INetParser;
  let solGenerator: TemplateEngine; 
  let tsGenerator: TemplateEngine; 
  let stateChannelRootGenerator: TemplateEngine; 

  beforeEach(() => {
    parser = new INetFastXMLParser();
    solGenerator = new SolidityProcessEnactment();
    tsGenerator = new TypeScriptEnactFunc();
    stateChannelRootGenerator = new SolidityProcessChannel();
  });

  describe('compile() using default template', function () {

    it('Compile correct event based XOR to Sol Contract 1', function() {
      readFile(__dirname + '/bpmn/EventBasedXOR.bpmn')
      .then((data) => {
        parser.fromXML(data).then((iNet) => {
          solGenerator.compile(iNet).catch(error => console.log(error));
        })
      })
      .catch((error) => {
        console.error(error);
      });
    });

    it('Compile correct event based XOR to Sol Contract 2', function() {
      readFile(__dirname + '/bpmn/EventBasedXOR_2.bpmn')
      .then((data) => {
        parser.fromXML(data).then((iNet) => {
          solGenerator.compile(iNet)
          .then((gen) => {
            console.log(gen.target);
            console.log(gen.encoding);
          })
          .catch(error => console.log(error));
        })
      })
      .catch((error) => {
        console.error(error);
      });
    });

    it('Compile correct AND to Sol Contract', function() {
      readFile(__dirname + '/bpmn/SimpleAND.bpmn')
      .then((data) => {
        parser.fromXML(data).then((iNet) => {
          solGenerator.compile(iNet)
          .then((gen) => {
            console.log(gen.target);
            console.log(gen.encoding);
          })
          .catch(error => console.log(error));
        })
      })
      .catch((error) => {
        console.error(error);
      });
    });

    it('Compile correct event based XOR to typescript', function() {
      readFile(__dirname + '/bpmn/EventBasedXOR.bpmn')
      .then((data) => {
        parser.fromXML(data).then((iNet) => {
          tsGenerator.compile(iNet).catch(error => console.log(error));
        })
      })
      .catch((error) => {
        console.error(error);
      });
    });

    it('Compile correct incident management case to StateChannel Contract', function() {
      readFile(__dirname + '/bpmn/incident-management.bpmn')
      .then((data) => {
        parser.fromXML(data).then((iNet) => {
          stateChannelRootGenerator.compile(iNet)
          .then((gen) => {
            console.log(gen.encoding);
            fs.writeFile(path.join(__dirname, 
              "..", "contracts/gen/incident-management/IM_ProcessChannel.sol"), 
              gen.target.replace("contract ProcessChannel", "contract IM_ProcessChannel"), 
              { flag: 'w+' },
              (err) => { if (err) { console.error(err); } });
              console.log("IM_ProcessChannel.sol generated.")
          });
        })
      })
      .catch((error) => {
        console.error(error);
      });
    });

    it('Compile correct incident management case to Typescript Contract', function() {
      readFile(__dirname + '/bpmn/incident-management.bpmn')
      .then((data) => {
        parser.fromXML(data).then((iNet) => {
          tsGenerator.compile(iNet)
          .then((gen) => {
            //console.log(gen.encoding);
            fs.writeFile(path.join(__dirname, 
              "..", "contracts/gen/incident-management/IM_ProcessChannel.ts"), 
              gen.target, 
              { flag: 'w+' },
              (err) => { if (err) { console.error(err); } });
              console.log("IM_ProcessChannel.ts generated.")
          });
        })
      })
      .catch((error) => {
        console.error(error);
      });
    });

  });

  describe('compile() using specified template', function () {

    it('compile correct event based XOR to Sol Contract', function() {
      readFile('./src/Generator/templates/ProcessEnactment.sol')
      .then((template) => {
        readFile(__dirname + '/bpmn/EventBasedXOR.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            solGenerator.compile(iNet, template.toString()).catch(error => console.log(error));
          })
        })
      })
      .catch((error) => {
        console.error(error);
      });
    });

    it('compile correct event based XOR to StateChannel Contract', function() {
      readFile('./src/Generator/templates/ProcessChannel.sol')
      .then((template) => {
        readFile(__dirname + '/bpmn/EventBasedXOR.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            stateChannelRootGenerator.compile(iNet, template.toString()).catch(error => console.log(error));
          })
        })
      })
      .catch((error) => {
        console.error(error);
      });
    });

  });
});