{{!// ---- instance support ----- }}
{{#if isInstanced}}
processData[instance].{{{name}}} = _{{{name}}};
{{else}}
{{!// ---- direct assignment (uninstanced) ----- }}
{{{name}}} = _{{{name}}};
{{/if}}