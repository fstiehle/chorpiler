{{#each callList}}
interface I{{{name}}} is IInstanceExecution {
  function instance(address[{{{numberOfParticipants}}}] memory participants) external returns (uint);
}
I{{{name}}} constant {{name}} = I{{{name}}}({{address}});
{{/each}}