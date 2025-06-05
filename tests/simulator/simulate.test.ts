import SolDefaultContractGenerator from "../../src/Generator/target/Sol/DefaultGenerator";
import { Simulation, Simulator } from "../../src/Simulator/Simulator";

describe('Simulate...', () => {

  const sim = new Simulator(__dirname);

  before(() => {
    return sim.generate(
      "test_", 
      new Simulation({ unfoldSubNets: true, loopProtection: false, parseConditions: true }));
  })

  it("", () => {})

})