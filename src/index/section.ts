import { AstItem, getMapValue } from './ast';
import { Location } from './location';
import { Position } from './position';
import { Reference } from "./reference";

export interface QueryOptions {
  name?: string;
  section_type?: string;
  type?: string;
  name_position?: Position;
  position?: Position;
  id?: string;
  unique?: boolean;
}

export class Section {
  references: Reference[] = [];

  // variable, resource or data (for example)
  readonly sectionType: string;

  // optional: but might for example be "aws_s3_bucket"
  readonly type?: string;
  readonly typeLocation?: Location;
  readonly name: string;
  readonly nameLocation: Location;
  readonly location: Location;
  readonly node: AstItem;

  readonly attributes: Map<string, string>;

  constructor(
    sectionType: string,
    type: string | null,
    typeLocation: Location | null,
    name: string,
    nameLocation: Location,
    location: Location,
    node: AstItem) {

    this.sectionType = sectionType;
    this.type = type;
    this.typeLocation = typeLocation;
    this.name = name;
    this.nameLocation = nameLocation;
    this.location = location;
    this.node = node;

    if (node)
      this.attributes = getMapValue(node.Val, { stripQuotes: true });
    else
      this.attributes = new Map<string, string>();
  }

  match(options?: QueryOptions): boolean {
    if (!options)
      return true;

    if (options.id && !this.id().match(options.id))
      return false;

    if (options.section_type && this.sectionType !== options.section_type)
      return false;

    if (this.type) {
      if (options.type && !this.type.match(options.type))
        return false;
    } else {
      if (options.type)
        return false;
    }

    if (options.name && !this.name.match(options.name))
      return false;

    if (options.name_position && !this.nameLocation.range.contains(options.name_position))
      return false;

    if (options.position && !this.location.range.contains(options.position))
      return false;

    return true;
  }

  id(rename?: string): string {
    let name = rename || this.name;

    if (this.sectionType === "variable") {
      return `var.${name}`;
    }
    if (this.sectionType === "local") {
      return `local.${name}`;
    }

    if (this.sectionType === "data")
      return [this.sectionType, this.type, name].join(".");

    if (this.sectionType === "output")
      return this.name;

    return [this.type, name].join(".");
  }
}