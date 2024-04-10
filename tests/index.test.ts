import 'mocha';
import { assert } from 'chai';

import chorpiler from '../src/index';

describe('NPM Package', () => {
  it('should be an object', () => {
    assert.isObject(chorpiler);
  });

  it('should have Parser, generators, and utils property', () => {
    assert.property(chorpiler, 'Parser');
    assert.property(chorpiler, 'generators');
    assert.property(chorpiler, 'utils');
  });
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
  });
});