import { Signal } from "./Netlist";
import { InputPin, OutputPin } from "../chip/Pins";
import { Value } from "./Value";

export class Connection {
  private id: string;
  private from: OutputPin;
  private to: InputPin;

  constructor(id: string, from: OutputPin, to: InputPin) {
    this.id = id;
    this.from = from;
    this.to = to;
  }

  public getId() {
    return this.id;
  }
  public getFrom() {
    return this.from;
  }
  public getTo() {
    return this.to;
  }

  public createSignal(value: Value): Signal {
    return {
      to: this.to,
      from: this.from,
      value: value
    }
  }
};