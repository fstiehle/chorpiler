import { expect, use } from "chai";
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

// Test Parsing and Generation works with all supported elements 
describe('Test Parsing and Generation', function () {

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

  describe('Parse correct BPMN and generate artefacts using default templates', function () {

    it('Compile model with XOR to Sol contract', function() {
      return expect(readFile(__dirname + '/bpmn/XOR.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            return solGenerator.compile(iNet);
          })
        })
      ).to.eventually.be.fulfilled
    });

    it('Compile model with XOR used to skip to the end event to Sol contract', function() {
      return expect(readFile(__dirname + '/bpmn/XOR_skip.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            return solGenerator.compile(iNet);
          })
        })
      ).to.eventually.be.fulfilled;
    });

    it('Compile model with AND to sol contract', function() {
      return expect(readFile(__dirname + '/bpmn/AND.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            return solGenerator.compile(iNet);
          })
        })
      ).to.be.eventually.fulfilled;
    });

    it('Compile model with XOR to TypeScript', function() {
      return expect(readFile(__dirname + '/bpmn/XOR.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            return tsGenerator.compile(iNet);
          })
        })
      ).to.be.eventually.fulfilled;
    });

  });

  describe('Parse and compile use cases', function () {

    it('Compile supply chain case to Sol channel contract', function() {
      return expect(readFile(__dirname + '/bpmn/cases/supply-chain.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            stateChannelRootGenerator.compile(iNet)
            .then((gen) => {
              // console.log(gen.encoding);
              fs.writeFile(path.join(__dirname, 
                "..", "output/generated/supply-chain/SC_ProcessChannel.sol"), 
                gen.target.replace("contract ProcessChannel", "contract SC_ProcessChannel"), 
                { flag: 'w+' },
                (err) => { if (err) { throw err; } });
            })
          })
        })
      ).be.eventually.fulfilled;
    });

    it('Compile supply chain case to TypeScript', function() {
      return expect(readFile(__dirname + '/bpmn/cases/supply-chain.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            tsGenerator.compile(iNet)
            .then((gen) => {
              // console.log(gen.encoding);
              fs.writeFile(path.join(__dirname, 
                "..", "output/generated/supply-chain/SC_Enact.ts"), 
                gen.target, 
                { flag: 'w+' },
                (err) => { if (err) { throw err; } });
            })
          })
        })
      ).to.be.eventually.fulfilled;
    });

    it('Compile incident management case to Sol channel contract', function() {
      return expect(readFile(__dirname + '/bpmn/cases/incident-management.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            stateChannelRootGenerator.compile(iNet)
            .then((gen) => {
              // console.log(gen.encoding);
              fs.writeFile(path.join(__dirname, 
                "..", "output/generated/incident-management/IM_ProcessChannel.sol"), 
                gen.target.replace("contract ProcessChannel", "contract IM_ProcessChannel"), 
                { flag: 'w+' },
                (err) => { if (err) { throw err } });
            });
          })
        })
      ).to.be.eventually.fulfilled;
    });

    it('Compile incident management case to TypeScript', function() {
      return expect(readFile(__dirname + '/bpmn/cases/incident-management.bpmn')
        .then((data) => {
          parser.fromXML(data).then((iNet) => {
            tsGenerator.compile(iNet)
            .then((gen) => {
              //console.log(gen.encoding);
              fs.writeFile(path.join(__dirname, 
                "..", "output/generated/incident-management/IM_ProcessChannel.ts"), 
                gen.target, 
                { flag: 'w+' },
                (err) => { if (err) { throw err; } });
            });
          })
        })
      ).to.be.eventually.fulfilled;
    });
  })

  describe('Parse and generate using specified template', function () {

    it('compile XOR to Sol contract', function() {
      return expect(readFile('./src/Generator/templates/ProcessEnactment.sol')
        .then((template) => {
          readFile(__dirname + '/bpmn/XOR.bpmn')
          .then((data) => {
            parser.fromXML(data).then((iNet) => {
              return solGenerator.compile(iNet, template.toString());
            })
          })
        })
      ).to.be.eventually.fulfilled;
    });

  });
});