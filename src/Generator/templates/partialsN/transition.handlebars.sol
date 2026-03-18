// <--- {{#if modelID}}{{modelID}} {{taskName}}{{else}} auto transition {{/if}} --->
{{#if hasConditions}}
{{!// ---- additional conditions to be checked ----- }}
if ({{{conditionString}}}) {
  {{> firing }}
}
{{else}}
{{!// ---- no additional conditions to be checked: direct firing ----- }}
{{> firing }}
{{/if}}