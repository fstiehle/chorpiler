import { INetFastXMLParser } from './Parser/Parser';

export default {
  Parser: INetFastXMLParser,
  Generator: {
    TemplateEngine: TemplateEngine,
    Sol: {
      
    }
  }
}


export {INetFastXMLParser} from './Parser/Parser';
export * from './Generator/TemplateEngine';
export * from './Generator/Sol/ProcessContract';
export * from './Generator/Sol/StateChannelRoot';