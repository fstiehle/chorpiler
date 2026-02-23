// Case Variable {{{name}}}
{{{expression}}}

{{#setters}}
function {{{functionName}}}(uint instance, {{{type}}} _{{{name}}}) external {
  {{{name}}} = _{{{name}}};
}
{{/setters}}