import { Netlist } from "../netlist/Netlist";

export class WorkingChip {
  private netlist: Netlist;

  constructor(netlist?: Netlist) {
    this.netlist = netlist || new Netlist([], []);
  }
}