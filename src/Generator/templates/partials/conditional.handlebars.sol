// <--- {{#if modelID}}{{modelID}} {{taskName}}{{else}} auto transition {{/if}} --->
{{#if this.hasConditions}}
if ({{{this.conditionString}}}) {
  {{> transition }}
}
{{else}}
{{> transition }}
{{/if}}