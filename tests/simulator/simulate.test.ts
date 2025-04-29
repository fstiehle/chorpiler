import { Simulator } from "../../src/Simulator/Simulator";

describe('Simulate...', () => {

  const sim = new Simulator(__dirname);

  before(() => {
    return sim.generate();
  })

})