import { expect, use } from "chai";
import * as fs from 'fs';
import {INetParser} from "../../src/Parser/Parser";
import chaiAsPromised from 'chai-as-promised';
import util from 'util';
import { TemplateEngine }  from "../../src/Generator/TemplateEngine";
import path from "path";
import { BPMN_PATH, OUTPUT_PATH } from "../config";
import { ProcessEncoding } from "../../src/Generator/ProcessEncoding";
import { INetFastXMLParser } from "../../src/Parser/FastXMLParser";
import SolDefaultContractGenerator from "../../src/Generator/target/Sol/DefaultContractGenerator";
import TypeScriptGenerator from "../../src/Generator/target/Typescript/DefaultFuncGenerator";
import SolStateChannelContractGenerator from "../../src/Generator/target/Sol/StateChannelContractGenerator";

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
use(chaiAsPromised);

const parseCompile = async (bpmnPath: string, parser: INetParser, gen: TemplateEngine) => {
  const data = await readFile(bpmnPath);
  return parser.fromXML(data).then((iNet) => {
    return gen.compile(iNet);
  });
}
const testCase = async (bpmnPath: string, parser: INetParser, generator: TemplateEngine, outputPath: string, caseLabel: string) => {
  const output = await parseCompile(bpmnPath, parser, generator);

  await writeFile(
    path.join(outputPath.replace(".sol", "_encoding.json")), 
    JSON.stringify(ProcessEncoding.toJSON(output.encoding)), 
    { flag: 'w+' }
  );

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
    solGenerator = new SolDefaultContractGenerator();
    tsGenerator = new TypeScriptGenerator();
    stateChannelRootGenerator = new SolStateChannelContractGenerator();
  });

  describe('Parse correct BPMN and generate artefacts using default templates', () => {

    it('Compile model with XOR to Sol contract', () => {
      return parseCompile(path.join(BPMN_PATH, 'xor.bpmn'), parser, solGenerator);
    });

    it('Compile model with XOR that allows to skip to the end event to Sol contract', () => {
      return parseCompile(path.join(BPMN_PATH, 'xor-skip.bpmn'), parser, solGenerator);
    });

    it('Compile model with AND to sol contract', () => {
      return parseCompile(path.join(BPMN_PATH, 'and.bpmn'), parser, solGenerator);
    });

    it('Compile model with XOR to TypeScript', () => {
      return parseCompile(path.join(BPMN_PATH, 'xor.bpmn'), parser, tsGenerator);
    });

    it('Compile model with XOR that allows to skip to the end event to TypeScript', () => {
      return parseCompile(path.join(BPMN_PATH, 'xor-skip.bpmn'), parser, tsGenerator);
    });

    it('Compile model with AND to TypeScript', () => {
      return parseCompile(path.join(BPMN_PATH, 'and.bpmn'), parser, tsGenerator);
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
        path.join(BPMN_PATH, '/cases/supply-chain/supply-chain.bpmn'), 
        parser, 
        solGenerator, 
        path.join(OUTPUT_PATH, "/supply-chain/SC_ProcessExecution.sol"),
        "SC_"
      );
      
    });

    it('to State Channel Root', async () => {

      return testCase(
        path.join(BPMN_PATH, '/cases/supply-chain/supply-chain.bpmn'), 
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
        path.join(BPMN_PATH, '/cases/incident-management/incident-management.bpmn'), 
        parser, 
        solGenerator, 
        path.join(OUTPUT_PATH, "/incident-management/IM_ProcessExecution.sol"),
        "IM_"
      );
      
    });

    it('to State Channel Root', async () => {

      return testCase(
        path.join(BPMN_PATH, '/cases/incident-management/incident-management.bpmn'), 
        parser, 
        stateChannelRootGenerator, 
        path.join(OUTPUT_PATH, "/incident-management/IM_ProcessChannel.sol"),
        "IM_"
      );
      
    });

  });

  describe('Parse and generate using specified template', () => {

    it('compile XOR to Sol contract', () => {
      return expect(readFile(path.join(__dirname, "..", "..", "src/Generator/templates/ProcessExecution.sol"))
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