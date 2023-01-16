import { expect, use } from "chai";
import * as fs from 'fs';
import {INetParser, INetFastXMLParser} from "../src/Parser/Parser";
import chaiAsPromised from 'chai-as-promised';

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
        expect(parser.fromXML(data)).to.eventually.be.not.null.notify(done);
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
});