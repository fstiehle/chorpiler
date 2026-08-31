/**
 * Represents compile options in the template encoding.
 * Used for controlling conditional rendering in templates.
 *
 * Template expressions used throughout various partials:
 * - options.debug: null/false disables debug; "foundry" imports {console} from
 *   "forge-std/console.sol"; any other truthy value imports "hardhat/console.sol"
 * - options.events: whether to emit Solidity events
 * - additional arbitrary options may be stored in `extras`
 */
export class Options {
  public extras: Record<string, any>;

  constructor(
    public debug: null | "hardhat" | "foundry" | string | boolean = null,
    public events: boolean = false,
    extras: Record<string, any> = {},
  ) {
    this.extras = extras || {};
  }
}
