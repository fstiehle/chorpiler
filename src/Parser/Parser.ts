import BpmnModdle from 'bpmn-moddle';
import InteractionNet from './InteractionNet';

export interface Parser {
  fromXML(xml: Buffer): Promise<InteractionNet>;
}

export class ModdleParser implements Parser {
  moddle: any;

  constructor() {
    this.moddle = new BpmnModdle();
  }

  fromXML(xml: Buffer): Promise<InteractionNet> {
    return new Promise<InteractionNet>((resolve, reject) => {
      this.moddle.fromXML(xml.toString())
      .then((parsed: any) => {
        //console.log(parsed)
        const net = new InteractionNet();
        resolve(net);
      })
      .catch((error: Error) => {
        reject(error);
      });
    })
  }
}