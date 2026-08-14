{{!// ---- instance support ----- }}
{{#if isInstanced}}
instanceData[instanceID].state.{{{name}}} = _{{{name}}};
{{else}}
{{!// ---- direct assignment (uninstanced) ----- }}
{{{name}}} = _{{{name}}};
{{/if}}