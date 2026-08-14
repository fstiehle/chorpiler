# TemplateN Class Structure

This document provides a visual representation of the Template class hierarchy.

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
├── DataTask[] (from dataTasks)
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
│       └── {{#each dataTasks}}
│           ├── DataTask class (with propagated: options, isInstanced, hasSubProcesses, id)
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