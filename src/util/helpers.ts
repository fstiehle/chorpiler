import { Place, TaskLabel, Transition, Element, PlaceType, Label, LabelType } from "../Parser/Element";
import { InteractionNet } from "../Parser/InteractionNet";

export const deleteFromArray = (array: Array<any>, key: any) => {
  const index = array.indexOf(key, 0);
  if (index > -1) {
    array.splice(index, 1);
  }
}

export const printInet = (iNet: InteractionNet): void => {
  console.log(`Interaction Net: ${iNet.id}`);
  if (!iNet.initial) {
    console.log("No initial place defined.");
    return;
  }

  const visited = new Set<string>();
  const traverse = (element: Element, depth: number = 0) => {
    if (visited.has(element.id)) {
      console.log(`${"  ".repeat(depth)}(Loop back to ${element.id})`);
      return;
    }

    visited.add(element.id);

    if (element instanceof Place) {
      console.log(`${"  ".repeat(depth)}o ${element.id}`);
      if (element.type === PlaceType.End) {
        console.log(`${"  ".repeat(depth)} (End)`);
        return;
      }
      for (const transition of element.target) {
        traverse(transition, depth + 1);
      }
    } else if (element instanceof Transition) {
      let transitionDetails = `[${element.id}]`;

      // Check if the transition has a TaskLabel
      if (element.label instanceof TaskLabel) {
        transitionDetails += ` (Task: ${element.label.name})`;
      } else {
        transitionDetails += ` (${LabelType[element.label.type]})`;
      }

      // Print guards if they exist
      if (element.label.guards && element.label.guards.size > 0) {
        const guardDetails = Array.from(element.label.guards.entries())
          .map(([_, guard]) => `${guard.condition || "defaultflow"}`)
          .join(", ");
        transitionDetails += ` !Guards: ${guardDetails}`;
      }

      console.log(`${"  ".repeat(depth)}${transitionDetails}`);
      for (const place of element.target) {
        traverse(place, depth + 1);
      }
    }
  };

  traverse(iNet.initial);
  for (const subNet of iNet.subNets.values()) {
    printInet(subNet);
  }
}