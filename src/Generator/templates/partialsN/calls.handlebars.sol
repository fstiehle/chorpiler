{{#if hasCalls}}
{{!// ---- Call Interface ----- }}
interface IInstanceCall {
  function instance(address[] memory participants) external returns (uint);
  function enact(uint instance, uint id) external;
  function getTokenState(uint instance) external view returns (uint);
}
{{#each callList}}

{{!// ---- Initate Call Contract interfaces ----- }}
// Interface for {{{name}}}
interface I{{{name}}} is IInstanceCall {
  function instance(address[{{{numberOfParticipants}}}] memory participants) external returns (uint);
}
I{{{name}}} constant {{name}} = I{{{name}}}({{address}});
{{/each}}
{{/if}}