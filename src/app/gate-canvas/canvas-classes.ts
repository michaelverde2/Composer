import { Gate } from "../gate/gate"

export class QBit {
  spots: Spot[] = [];
  mode: number = 0;
  parameters: any[] = [];
  random: boolean = false;

  constructor(idx:number, length: number) { 
    for(let i = 0; i< length ; i++){
      let spot = new Spot(idx, i);
      this.spots.push(spot);
    }
  }
}
 
export class Spot {
  bitIdx: number;
  spotIdx: number; 
  showBg: boolean = true; 
  gate: Gate = new Gate();
  constructor(bitIdx: number, spotIdx: number) { 
    this.bitIdx = bitIdx;
    this.spotIdx = spotIdx;
    this.gate.bitIdx = bitIdx;
    this.gate.spotIdx = spotIdx;
  }
}

export class CBit {
  measurements: Measurement[] = [];
  constructor(length: number) { 
    for(let i = 0; i< length ; i++){
      let measurement = new Measurement(i);
      this.measurements.push(measurement);
    }
  }
}

export class Measurement {
  measurmentIdx: number;  
  active:boolean;
  linked:boolean;
  bit:number;
  bit2:number;
  constructor(measurmentIdx: number) { 
    this.measurmentIdx = measurmentIdx;
    this.active = false;
    this.linked = false;
    this.bit = null;
    this.bit2 = null;
  }
}

  