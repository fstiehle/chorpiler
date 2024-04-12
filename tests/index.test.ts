import { assert } from 'chai';
// also test some imports
import chorpiler, { ProcessEncoding, InteractionNet, INetParser, TemplateEngine } from '../src/index';
import * as fs from 'fs';
import path from 'path';
import { BPMN_PATH } from './config';

describe('NPM Package', () => {
  it('should be an object', () => {
    assert.isObject(chorpiler);
  });

  it('should have Parser, generators, and utils property', () => {
    assert.property(chorpiler, 'Parser');
    assert.property(chorpiler, 'generators');
    assert.property(chorpiler, 'utils');
  });

  it('should allow importing interfaces', () => {
    class test implements INetParser {
      fromXML(xml: Buffer): Promise<InteractionNet> {
        throw new Error('Method not implemented.');
      }
    }
    class test2 implements TemplateEngine {
      compile(iNet: InteractionNet, template?: string): Promise<{ target: string; encoding: ProcessEncoding; }> {
        throw new Error('Method not implemented.');
      }
      getTemplate(): Promise<string> {
        throw new Error('Method not implemented.');
      }
    }
  });

  describe('Parser', () => {
    it('should conform to parser interface', () => {
      const parser = new chorpiler.Parser()
      assert.isObject(parser);
      assert.isFunction(parser.fromXML);
    });
  });

  describe('generators', () => {
    it('should have sol property', () => {
      const gens = chorpiler.generators;
      assert.property(gens, 'sol');
      assert.property(gens.sol, 'DefaultContractGenerator');
      assert.property(gens.sol, 'StateChannelContractGenerator');
    });

    it('should conform to template engine interface', () => {
      assert.isFunction(new chorpiler.generators.sol.DefaultContractGenerator().compile)
      assert.isFunction(new chorpiler.generators.sol.StateChannelContractGenerator().compile)
    });
  });
});

describe('readme code', () => {
  it('should run', async () => {
    const parser = new chorpiler.Parser();

    const contractGenerator = new chorpiler
      .generators.sol.DefaultContractGenerator();

    const stateChannelGenerator = new chorpiler
      .generators.sol.StateChannelContractGenerator();

    const bpmnXML = fs.readFileSync(path.join(BPMN_PATH, 'xor.bpmn'));   
    // parse BPMN file into petri net
    const iNet = await parser.fromXML(bpmnXML);

    // compile to smart contract
    return contractGenerator.compile(iNet)
    .then((gen) => {
      fs.writeFileSync(
        "Process.sol", 
        gen.target, 
        { flag: 'w+' }
      );
      console.log("Process.sol generated.");
      // log encoding of participants and tasks, 
      // can also be written to a .json file
      console.log(ProcessEncoding.toJSON(gen.encoding));
    })
    .catch(err => console.error(err));
  });

  it('should generate Process.sol', () => {
    assert.isOk(fs.existsSync("Process.sol"));
  });

  after(() => {
    // cleanup
    fs.unlinkSync("Process.sol");
  })

});
 