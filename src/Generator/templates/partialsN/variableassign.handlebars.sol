{{!// ---- instance support ----- }}
{{#if isInstanced}}
processData[instanceID].{{{name}}} = _{{{name}}};
{{else}}
{{!// ---- direct assignment (uninstanced) ----- }}
{{{name}}} = _{{{name}}};
{{/if}}