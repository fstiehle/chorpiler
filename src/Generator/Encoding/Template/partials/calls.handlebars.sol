{{#if hasCalls}}

{{!// ---- Call Interface ----- }}
interface IInstanceCall {
  function instance(uint nonce, address[] memory participants) external returns (bytes32);
  function enact(bytes32 instance, uint id) external;
  function getTokenState(bytes32 instance) external view returns (uint);
}
{{#each callList}}

{{!// ---- Initate Call Contract interfaces ----- }}
// Interface for {{{name}}}
interface I{{{name}}} is IInstanceCall {
  function instance(uint nonce, address[{{{numberOfParticipants}}}] memory participants) external returns (bytes32);
}
I{{{name}}} constant {{name}} = I{{{name}}}({{address}});
{{/each}}
{{/if}}