# TemplateN Class Structure

This document provides a visual representation of the TemplateN class hierarchy and template file mappings.

## Class Hierarchy with Template Files

```
Contract (Root)
│ Used in: Contract.handlebars.sol
│
├── Options
│   │ Used in: All templates (propagated through hierarchy)
│   ├── debug: boolean
│   └── events: boolean
│
├── Call[] (from callList)
│   │ Used in: calls.handlebars.sol
│   ├── name: string
│   ├── address: string
│   └── numberOfParticipants: string
│
├── CaseVariable[] (from caseVariables)
│   │ Used in: casevariables.handlebars.sol
│   ├── name: string
│   ├── isInstanced: boolean (PROPAGATED)
│   ├── expression: string
│   ├── setters: boolean
│   ├── functionName: string
│   └── type: string
│
├── TaskWithCaseVar[] (from taskWithCaseVar)
│   │ Used in: datatasks.handlebars.sol
│   ├── modelID: string
│   ├── isInstanced: boolean (PROPAGATED)
│   ├── type: string
│   ├── name: string
│   ├── consume: string
│   ├── conditionString: string
│   ├── produce: string
│   ├── options: Options (PROPAGATED)
│   ├── hasSubProcesses: boolean (PROPAGATED)
│   └── id: string (PROPAGATED)
│
├── State[] (from states)
│   │ Used in: states.handlebars.sol
│   ├── consume: string
│   ├── isDecision: boolean
│   ├── options: Options (PROPAGATED)
│   ├── isInstanced: boolean (PROPAGATED)
│   ├── hasSubProcesses: boolean (PROPAGATED)
│   ├── id: string (PROPAGATED)
│   ├── modelID: string (PROPAGATED)
│   └── Transition[]
│       │ Used in: transitions.handlebars.sol, transition.handlebars.sol
│       ├── modelID: string | null
│       ├── taskName: string | null
│       ├── hasConditions: boolean
│       ├── conditionString: string
│       ├── consume: string
│       ├── produce: string | null
│       ├── outTo: OutTo | null
│       │   │ Used in: firing.handlebars.sol
│       │   ├── call: { id: string }
│       │   ├── isSub: boolean
│       │   ├── isCall: boolean
│       │   └── callString: string | null
│       ├── isSub: boolean
│       ├── isCall: boolean
│       ├── taskID: string | null
│       ├── isEnd: boolean
│       ├── initiator: string | null
│       ├── defaultBranch: boolean
│       ├── decision: string | null
│       └── options: Options (PROPAGATED)
│
└── SubProcess[] (from subProcesses)
    │ Used in: subprocesses.handlebars.sol
    ├── modelID: string
    ├── id: string
    └── State[] (recursive - includes all propagated properties)
```

## Template Hierarchy

```
Contract.handlebars.sol (Root Template)
│
├── {{> interfaces}}
│   └── interfaces.handlebars.sol
│       └── Uses: hasCalls
│
├── {{> calls}}
│   └── calls.handlebars.sol
│       └── {{#each callList}}
│           └── Call class
│
├── {{> parameters}}
│   └── parameters.handlebars.sol
│       └── Uses: hasCalls, numberOfCalls, hasSubProcesses, numberOfProcesses,
│                  numberOfParticipants, options.events
│
├── {{> casevariables}}
│   └── casevariables.handlebars.sol
│       └── {{#each caseVariables}}
│           ├── CaseVariable class (with propagated: isInstanced)
│           └── {{> variableassign}}
│               └── variableassign.handlebars.sol
│                   └── Uses: isInstanced, name
│
├── {{> datatasks}}
│   └── datatasks.handlebars.sol
│       └── {{#each taskWithCaseVar}}
│           ├── TaskWithCaseVar class (with propagated: options, isInstanced, hasSubProcesses, id)
│           ├── {{> variableassign}}
│           │   └── variableassign.handlebars.sol
│           │       └── Uses: isInstanced, name
│           └── {{> tokenstate}}
│               └── tokenstate.handlebars.sol
│                   └── Uses: isInstanced, hasSubProcesses, id
│
├── {{> states}}
│   └── states.handlebars.sol
│       ├── Uses: options.debug, modelID
│       ├── {{> tokenstate}}
│       │   └── tokenstate.handlebars.sol
│       │       └── Uses: isInstanced, hasSubProcesses, id
│       └── {{#each states}}
│           ├── State class (with propagated: options, isInstanced, hasSubProcesses, id, modelID)
│           └── {{> transitions}}
│               └── transitions.handlebars.sol
│                   └── {{#each transitions}}
│                       ├── Transition class (with propagated: options)
│                       └── {{> transition}}
│                           └── transition.handlebars.sol
│                               └── {{> firing}}
│                                   └── firing.handlebars.sol
│                                       ├── Uses: options.events, taskName, consume,
│                                       │        produce, taskID, isEnd, initiator
│                                       └── Uses OutTo: outTo.call.id, isSub, isCall,
│                                                       callString
│
└── {{> subprocesses}}
    └── subprocesses.handlebars.sol
        └── {{#each subProcesses}}
            ├── SubProcess class
            └── {{> states}} (recursive)
                └── [Same structure as main states above]
```

## Property Propagation Pattern

Properties are propagated through the class hierarchy to support nested partials:

**Propagated to State:**
- `options: Options` - For debug logging in states.handlebars.sol
- `isInstanced: boolean` - For tokenstate partial
- `hasSubProcesses: boolean` - For tokenstate partial
- `id: string` - For sub-process token state array indexing
- `modelID: string` - For debug logging

**Propagated to Transition:**
- `options: Options` - For event emission in firing.handlebars.sol

**Propagated to TaskWithCaseVar:**
- `options: Options` - For debug logging in datatasks.handlebars.sol
- `isInstanced: boolean` - For variableassign and tokenstate partials
- `hasSubProcesses: boolean` - For tokenstate partial
- `id: string` - For tokenstate partial

**Propagated to CaseVariable:**
- `isInstanced: boolean` - For variableassign partial

These properties are passed through constructor parameters and ensure nested partials have access to required context.

## Template File Locations

All template files are located in:
- Main template: `chorpiler/src/Generator/templates/Contract.handlebars.sol`
- Partials: `chorpiler/src/Generator/templates/partialsN/*.handlebars.sol`

### Partial Files

1. **interfaces.handlebars.sol** - Interface declarations
2. **calls.handlebars.sol** - Called contract interfaces
3. **parameters.handlebars.sol** - Contract state variables and declarations
4. **casevariables.handlebars.sol** - Case variable declarations and setters
5. **datatasks.handlebars.sol** - Task functions that set case variables
6. **states.handlebars.sol** - Main state loop with token state checking
7. **transitions.handlebars.sol** - Transition iteration with decision logic
8. **transition.handlebars.sol** - Individual transition rendering
9. **firing.handlebars.sol** - Transition firing logic (token consumption/production)
10. **tokenstate.handlebars.sol** - Token state reference (handles instanced/sub-process variations)
11. **variableassign.handlebars.sol** - Variable assignment (handles instanced variations)
12. **subprocesses.handlebars.sol** - Sub-process function definitions

## Converter Class

**HandlebarsEncoding** - Converts `Encoding.MainProcess` to `Contract`
- Location: `chorpiler/src/Generator/Encoding/TemplateN/HandlebarsEncoding.ts`
- Method: `static fromEncoding(encoding: Encoding.MainProcess): Contract`
- Implements: `IFromEncoding` interface