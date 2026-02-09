import { Vector2 } from "../../../utils/Vector2";
import { GenericChipDetails } from "../chip/ChipLibrary";
import { InputPin, OutputPin } from "../chip/Pins";

export interface SerializedNetlist {

  chips: {
    id: string,
    details: GenericChipDetails
  }[];

  connections: {
    from: OutputPin;
    to: InputPin;
    id?: string
  }[];

}