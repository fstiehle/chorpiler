import { expect, use } from "chai";
import * as fs from 'fs';
import {INetParser, INetFastXMLParser} from "../src/Parser/Parser";
import chaiAsPromised from 'chai-as-promised';
import { SolidityMustache, TemplateEngine } from "../src/CodeGenerator/Generator";

use(chaiAsPromised);
describe('BPMN 2 Choreography Parsing', function () {
  describe('parse() with FastXMLParser', function () {
    let parser: INetParser;

    beforeEach(() => {
      parser = new INetFastXMLParser();
    })

    it('parse correct event based XOR', function(done) {
      fs.readFile(__dirname + '/bpmn/EventBasedXOR.bpmn', 
      function(err, data) {
        if (err) { console.error(err); done(err); }
        expect(parser.fromXML(data)).to.eventually.be.fulfilled.notify(done);
      });
    });

    it('parse correct call choreography and report missing support', function(done) {
      fs.readFile(__dirname + '/bpmn/CallChoreography.bpmn', 
      function(err, data) {
        if (err) { console.error(err); done(err); }
        expect(parser.fromXML(data)).to.eventually.be.rejected.notify(done);
      });
    });

    it('parse malformed model an report error', function(done) {
      fs.readFile(__dirname + '/bpmn/Malformed1.bpmn', 
      function(err, data) {
        if (err) { console.error(err); done(err); }
        expect(parser.fromXML(data)).to.eventually.be.rejected.notify(done);
      });
    });
  });

  describe('compile() with MustacheTemplateEngine', function () {
    let parser: INetParser;
    let generator: TemplateEngine; 

    beforeEach(() => {
      parser = new INetFastXMLParser();
      generator = new SolidityMustache()
    });

    it('compile correct event based XOR', function() {
      fs.readFile(__dirname + '/bpmn/EventBasedXOR.bpmn', 
      async function(err, data) {
        if (err) { console.error(err); }
        const iNet = await parser.fromXML(data);

        try {
          console.log(generator.compile(iNet))
        } catch (error) {
          console.log(error)
        }
      });
    });
  });
});