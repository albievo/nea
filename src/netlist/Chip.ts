// class Chip {
//   private behaviour: ChipBehaviour;

//   constructor(behaviourType: "netlist" | "primitive" | "truthtable", behaviourPayload: object) {
//     switch (behaviourType) {
//       case "netlist": this.behaviour = behaviourPayload.netlist
//     }
//   }

//   evaluate(inputs: Value[]): Value[] {
//     return this.behaviour.evaluate(inputs);
//   }
// }