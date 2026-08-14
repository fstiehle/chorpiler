This folder contains the encoding logic.
An iNet is parsed and then encoded, turning its model names and IDs of the XML into IDs to be used for the smart contract (e.g., `Task SID341` to `Task 0`). Then, further optimisations are applied. This is done by the Encoder.ts, using classes from the Encoding.ts class.

Then, the encoding representation can be used to define more use specific formats. This is done in `/JSON/` (to provide a machine-readable file on how to interact with the contract) and `/Template` (which produces data structures used in the template compilation).