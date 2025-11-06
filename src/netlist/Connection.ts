import { InputPin, OutputPin } from "./Pins";

export interface Connection {
  id: string,
  from: OutputPin,
  to: InputPin
};