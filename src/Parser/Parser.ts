import BpmnModdle from 'bpmn-moddle';
import InteractionNet from './InteractionNet';

export interface Parser {
  fromXML(xml: Buffer): Promise<InteractionNet>;
}


export class ModdleParser implements Parser {
  moddle: any;
  translation_rules = {
    "": "",
  }

  constructor() {
    this.moddle = new BpmnModdle();
  }

  fromXML(xml: Buffer): Promise<InteractionNet> {
    return new Promise<InteractionNet>((resolve, reject) => {
      this.moddle.fromXML(xml.toString())
      .then((parsed: any) => {
        let iNet: InteractionNet|null = null;
        const rootElements = parsed.rootElement.rootElements;
        const references = parsed.references
        for (let index = 0; index < rootElements.length; index++) {
          const element = rootElements[index];
          // find root choreography, we do not support call choreographies yet. 
          if (element.$type === "bpmn:Choreography") {
            return resolve(this.parseChoreography(element, references));
          }
        }
        if (iNet == null) {
          return reject("No choreography found");
        }   
      })
      .catch((error: Error) => {
        reject(error);
      });
    })
  }

  /**
   * Throw when unsupported element encountered.
   * @param element BpmnModdle bpmn:Choreography element
   * @returns InteractionNet 
   */
  parseChoreography(element: any, references: any): InteractionNet {
    const iNet = new InteractionNet();
    //console.log(references);
    return iNet;
  }
}