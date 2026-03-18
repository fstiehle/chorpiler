/**
 * Represents compile options in the template encoding.
 * Used for controlling conditional rendering in templates.
 *
 * Template expressions used throughout various partials:
 * - options.debug: whether to include debug console.log statements
 * - options.events: whether to emit Solidity events
 */
export class Options {
  constructor(
    public debug: boolean,
    public events: boolean,
  ) {}
}