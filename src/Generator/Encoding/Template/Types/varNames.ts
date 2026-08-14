/**
 * Constants for variable names used in template code generation.
 *
 * These constants define the standard variable names used in generated Solidity
 * contracts for state management, particularly for instanced processes.
 */

/**
 * Name of the instance data array variable in generated contracts.
 * Used to access instance-specific state and participants.
 */
export const INSTANCE_DATA = "instanceData";

/**
 * Name of the instance ID parameter/variable in generated contracts.
 * Used as an index into the instanceData array.
 */
export const INSTANCE_ID = "instanceID";

/**
 * Name of the state struct field within instance data.
 * Contains the choreography state including token state and case variables.
 */
export const STATE = "state";

/**
 * Name of the token state array within the state struct.
 * Tracks the number of tokens at each place in the Petri net.
 */
export const TOKEN_STATE = "tokenState";

/**
 * Name of the participants array (both global and per-instance).
 * Maps participant IDs to their Ethereum addresses.
 */
export const PARTICIPANTS = "participants";

/**
 * Helper function to build a reference to instance-specific state.
 *
 * @param field - The field name within the state struct (e.g., case variable name or "tokenState")
 * @returns Full reference path like "instanceData[instanceID].state.fieldName"
 */
export function buildInstanceStateRef(field: string): string {
  return `${INSTANCE_DATA}[${INSTANCE_ID}].${STATE}.${field}`;
}

/**
 * Helper function to build a reference to token state.
 *
 * @param placeId - The ID of the place in the Petri net
 * @param isInstanced - Whether this is an instanced process
 * @returns Either "instanceData[instanceID].state.tokenState[placeId]" or "tokenState[placeId]"
 */
export function buildTokenStateRef(placeId: string | number, isInstanced: boolean): string {
  if (isInstanced) {
    return `${buildInstanceStateRef(TOKEN_STATE)}[${placeId}]`;
  }
  return `${TOKEN_STATE}[${placeId}]`;
}

/**
 * Helper function to build a reference to participants.
 *
 * @param participantId - The ID of the participant
 * @param isInstanced - Whether this is an instanced process
 * @returns Either "instanceData[instanceID].participants[participantId]" or "participants[participantId]"
 */
export function buildParticipantsRef(participantId: string | number, isInstanced: boolean): string {
  if (isInstanced) {
    return `${INSTANCE_DATA}[${INSTANCE_ID}].${PARTICIPANTS}[${participantId}]`;
  }
  return `${PARTICIPANTS}[${participantId}]`;
}
