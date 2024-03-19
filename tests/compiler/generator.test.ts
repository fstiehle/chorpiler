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
const writeFile = util.promisify(fs.writeFile);
use(chaiAsPromised);

const BPMN_PATH = path.join(__dirname, 'bpmn');
const OUTPUT_PATH = path.join(__dirname, ".." , 'generated');

const parseCompile = async (bpmnPath: string, parser: INetParser, gen: TemplateEngine) => {
  const data = await readFile(bpmnPath);
  return parser.fromXML(data).then((iNet) => {
    return gen.compile(iNet);
  });
}

const testModel = (bpmnPath: string, parser: INetParser, generator: TemplateEngine) => {
  return parseCompile(bpmnPath, parser, generator);
}

const testCase = async (bpmnPath: string, parser: INetParser, generator: TemplateEngine, outputPath: string, caseLabel: string) => {
  const output = await parseCompile(bpmnPath, parser, generator);

  return writeFile(
    path.join(outputPath), 
    // need to append a label to the contract name as otherwise waffle will error when compiling
    // multiple contracts with the same name
    output.target.replace("contract ", "contract " + caseLabel), 
    { flag: 'w+' }
  );
}

// Test Parsing and Generation works with all supported elements 
describe('Test Parsing and Generation', () => {

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

  describe('Parse correct BPMN and generate artefacts using default templates', () => {

    it('Compile model with XOR to Sol contract', () => {
      return testModel(path.join(BPMN_PATH, 'xor.bpmn'), parser, solGenerator);
    });

    it('Compile model with XOR that allows to skip to the end event to Sol contract', () => {
      return testModel(path.join(BPMN_PATH, 'xor-skip.bpmn'), parser, solGenerator);
    });

    it('Compile model with AND to sol contract', () => {
      return testModel(path.join(BPMN_PATH, 'and.bpmn'), parser, solGenerator);
    });

    it('Compile model with XOR to TypeScript', () => {
      return testModel(path.join(BPMN_PATH, 'xor.bpmn'), parser, tsGenerator);
    });

    it('Compile model with XOR that allows to skip to the end event to TypeScript', () => {
      return testModel(path.join(BPMN_PATH, 'xor-skip.bpmn'), parser, tsGenerator);
    });

    it('Compile model with AND to TypeScript', () => {
      return testModel(path.join(BPMN_PATH, 'and.bpmn'), parser, tsGenerator);
    });

  });

  describe('Parse and compile supply chain case', () => {

    before(() => {
      if (!fs.existsSync(path.join(OUTPUT_PATH, "supply-chain"))) {
        fs.mkdirSync(path.join(OUTPUT_PATH, "supply-chain"));
      }
    })

    it('to Sol Contract', async () => {

      return testCase(
        path.join(BPMN_PATH, '/cases/supply-chain.bpmn'), 
        parser, 
        solGenerator, 
        path.join(OUTPUT_PATH, "/supply-chain/SC_ProcessExecution.sol"),
        "SC_"
      );
      
    });

    it('to State Channel Root', async () => {

      return testCase(
        path.join(BPMN_PATH, '/cases/supply-chain.bpmn'), 
        parser, 
        stateChannelRootGenerator, 
        path.join(OUTPUT_PATH, "/supply-chain/SC_ProcessChannel.sol"),
        "SC_"
      );
      
    });

  });

  describe('Parse and compile incident management case', () => {

    before(() => {
      if (!fs.existsSync(path.join(OUTPUT_PATH, "incident-management"))) {
        fs.mkdirSync(path.join(OUTPUT_PATH, "incident-management"));
      }
    })

    it('to Sol Contract', async () => {

      return testCase(
        path.join(BPMN_PATH, '/cases/incident-management.bpmn'), 
        parser, 
        solGenerator, 
        path.join(OUTPUT_PATH, "/incident-management/IM_ProcessExecution.sol"),
        "IM_"
      );
      
    });

    it('to State Channel Root', async () => {

      return testCase(
        path.join(BPMN_PATH, '/cases/incident-management.bpmn'), 
        parser, 
        stateChannelRootGenerator, 
        path.join(OUTPUT_PATH, "/incident-management/IM_ProcessChannel.sol"),
        "IM_"
      );
      
    });

  });

  describe('Parse and generate using specified template', () => {

    it('compile XOR to Sol contract', () => {
      return expect(readFile(path.join(__dirname, "..", "..", "src/Generator/templates/ProcessEnactment.sol"))
        .then((template) => {
          return readFile(path.join(BPMN_PATH, 'xor.bpmn'))
            .then((data) => {
              return parser.fromXML(data).then((iNet) => {
                return solGenerator.compile(iNet, template.toString());
              })
          })
      }))
      .to.eventually.contain.keys("target", "encoding");
    });

  });

});