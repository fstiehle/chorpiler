// Case Variable {{{name}}}
{{^isInstanced}}
{{{expression}}}
{{/isInstanced}}
{{#setters}}
function {{{functionName}}}({{#isInstanced}}uint instance, {{/isInstanced}}{{{type}}} _{{{name}}}) external {
  {{^isInstanced}}
  {{{name}}} = _{{{name}}};
  {{/isInstanced}}
  {{#isInstanced}}
  processData[instance].{{{name}}} = _{{{name}}};
  {{/isInstanced}}
}
{{/setters}}