{{!// ---- Call Support ----- }}
{{#if hasCalls}}
interface IInstanceExecution {
  function instance(address[] memory participants) external returns (uint);
  function enact(uint instance, uint id) external;
  function getTokenState(uint instance) external view returns (uint);
}

{{/if}}
{{!// ---- Contract Interface ----- }}
interface IProcessExecution {
  function enact(uint id) external;
  function getTokenState() external view returns (uint);
}