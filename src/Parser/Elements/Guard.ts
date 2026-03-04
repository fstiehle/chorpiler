// Labels can have guards
export class Guard {
  default: boolean = false;
  conditions = new Map<string, string>();

  constructor(
    public name: string,
    _default?: boolean,
  ) {
    if (_default != null) this.default = _default;
  }
}
