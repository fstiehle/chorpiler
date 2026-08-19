import Handlebars from "handlebars";
import { InteractionNet } from "../Parser/InteractionNet.js";
import util from "util";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { CaseVariable } from "./Encoding/Encoding.js";
import { INetEncoder } from "./Encoding/Encoder.js";
import { HandlebarsEncoding } from "./Encoding/Template/HandlebarsEncoding.js";
import { TriggerEncoding } from "./Encoding/JSON/TriggerEncoding.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readFile = util.promisify(fs.readFile);

export interface CompileOptions {
  unfoldSubNets: boolean; // If true, sub choreographies are "folded" into the main choreography, i.e.,
  // they are treated as visual option only with no consequence for the generated contract
  events: boolean; // emit Events on task execution
  // debug can be null (no debug), or a string identifying the debug runtime (e.g. 'hardhat' or 'foundry')
  debug: null | "hardhat" | "foundry" | boolean;
  // allow arbitrary extra options to be passed through by specific generators
  [key: string]: any;
}

export interface ITemplateEngine {
  addCaseVariable(variable: CaseVariable): void;
  deleteCaseVariable(variableName: string): boolean;
  getCaseVariable(variableName: string): CaseVariable | undefined;
  compile(options?: Partial<CompileOptions>): Promise<{ target: string; encoding: TriggerEncoding }>;
  setTemplatePath(path: string): void;
  getTemplate(): Promise<string>;
}

export abstract class TemplateEngine implements ITemplateEngine {
  private addressList = new Map<string, string>();

  constructor(
    public iNet: InteractionNet,
    private templatePath: string,
    private caseVariables = new Map<string, CaseVariable>(),
    private templatePartials = new Array<{ partial: string; path: string }>(),
    private isInstanced: boolean = false,
    private isChannel: boolean = false,
  ) {
    // Discover partials from both directories
    const partialsDir = path.join(path.dirname(this.templatePath), 'partials');
    const basePartials = this.discoverPartials(partialsDir);

    // Merge: constructor partials, then base partials, then partialsN (which override)
    const constructorPartialNames = this.templatePartials.map(p => p.partial);
    const basePartialsFiltered = basePartials.filter(p => !constructorPartialNames.includes(p.partial));

    // Build a map for efficient override handling
    const partialsMap = new Map<string, { partial: string; path: string }>();

    // Add constructor partials
    this.templatePartials.forEach(p => partialsMap.set(p.partial, p));

    // Add base partials (don't override constructor partials)
    basePartialsFiltered.forEach(p => partialsMap.set(p.partial, p));
    this.templatePartials = Array.from(partialsMap.values());
  }

  private discoverPartials(directory: string): Array<{ partial: string; path: string }> {
    const partials: Array<{ partial: string; path: string }> = [];

    try {
      if (fs.existsSync(directory)) {
        const files = fs.readdirSync(directory);
        for (const file of files) {
          if (file.endsWith('.handlebars.sol')) {
            const partialName = file.replace('.handlebars.sol', '');
            partials.push({
              partial: partialName,
              path: path.join(directory, file)
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to discover partials in ${directory}:`, error);
    }
    return partials;
  }

  async compile(_options?: Partial<CompileOptions>): Promise<{ target: string; encoding: TriggerEncoding }> {
    const options: CompileOptions = {
      unfoldSubNets: _options?.unfoldSubNets ?? false,
      loopProtection: _options?.loopProtection ?? true,
      events: _options?.events ?? false,
      debug: _options?.debug ?? null,
      // spread any additional keys passed in
      ...( (_options as any) || {} ),
    };
    if (this.iNet.initial == null || this.iNet.end == null) {
      throw new Error("Invalid InteractionNet");
    }
    const iNet: InteractionNet = { ...this.iNet }; // Deep copy: why?
    const template: string = await this.getTemplate();

    const encoder = new INetEncoder();
    const gen = encoder.generate(iNet, options, this.isInstanced, this.isChannel);
    gen.caseVariables = this.caseVariables;
    for (const message of iNet.namedMessages.values()) {
      let match = undefined;
      for (const [name, variable] of gen.caseVariables) {
        if (name == message.label) {
          variable.linkedMessage = message;
          message.caseVariable = variable;
        }
      }
    }

    if (gen.callList.size != this.addressList.size) {
      throw new Error(
        "Some call contracts have not been assigned addresses, use addCallAddress(callID: string, address: string).",
      );
    }

    // add the address of each callAddresses to the Call class in callList, match them based on the key of the map
    for (const [callID, address] of this.addressList.entries()) {
      const call = gen.callList.get(callID);
      if (call != undefined) {
        call.address = address;
      }
    }

    // Read and register partials with Handlebars
    const partialsContent = this.templatePartials.reduce(
      (acc: Record<string, string>, partial) => {
        acc[partial.partial] = fs.readFileSync(partial.path).toString();
        return acc;
      },
      {},
    );

    // Register partials with Handlebars
    Object.entries(partialsContent).forEach(([name, content]) => {
      Handlebars.registerPartial(name, content);
    });

    // Register custom helpers
    this.registerHandlebarsHelpers();

    // Compile and render template
    const compiledTemplate = Handlebars.compile(template);
    const encodedData = HandlebarsEncoding.fromEncoding(gen) as any;

    // Expose compile options to templates at render time so templates can
    // access e.g. options.rootAddress or options.debug
    encodedData.options = options;

    return {
      target: compiledTemplate(encodedData, {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
      }),
      encoding: TriggerEncoding.fromEncoding(gen),
    };
  }

  private registerHandlebarsHelpers() {
    // Helper to check if a value is non-zero (for handling "0" strings)
    Handlebars.registerHelper("nonZero", function (value) {
      return value && value !== "0";
    });

    // Helper to check if a value is truthy and not empty
    Handlebars.registerHelper("hasValue", function (value) {
      return value && value !== "" && value !== "0";
    });

    // Helper to detect strings (useful for debug import override)
    Handlebars.registerHelper("isString", function (value) {
      return typeof value === "string";
    });
  }

  addCaseVariable(variable: CaseVariable) {
    this.caseVariables.set(variable.name, variable);
  }
  deleteCaseVariable(variableName: string) {
    return this.caseVariables.delete(variableName);
  }
  getCaseVariable(variableName: string) {
    return this.caseVariables.get(variableName);
  }
  addCallAddress(callID: string, address: string) {
    if (!this.iNet.callList.has(callID))
      throw new Error(
        `Call Choreography with ID ${callID} does not exist in the InteractionNet`,
      );
    this.addressList.set(callID, address);
  }
  deleteCallAddress(callID: string) {
    this.addressList.delete(callID);
  }
  getCallAddress(callID: string) {
    this.addressList.get(callID);
  }
  setTemplatePath(path: string): void {
    this.templatePath = path;
  }
  async getTemplate(): Promise<string> {
    return (await readFile(this.templatePath)).toString();
  }
}
