import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { Gate } from "../gate/gate";
import { QBit, Spot, CBit, Measurement } from "./canvas-classes";
import { SavesService } from '../saves/saves.service';
import { polyfill } from 'mobile-drag-drop';

@Component({
  selector: 'gate-canvas',
  templateUrl: './gate-canvas.component.html',
  styleUrls: ['./gate-canvas.component.css']
})
export class GateCanvasComponent implements OnChanges  {
  @Input() dragData?: Gate;
  @Output() draggingData= new EventEmitter(); 

  initialized: boolean = false;
  showIdx: boolean = false;
  bits: QBit[] = [];
  cbit: CBit;
  numCBits: number;
  numQBits: number;
  canvasLength: number;
  gateInfo: string[];

  constructor(public savesService: SavesService) { 
    polyfill({});
  }

  ngOnChanges() {
    this.setUpCanvas();
  }

  setUpCanvas(){ 
    if(!this.initialized){
      this.savesService.currentSaveChange.subscribe((value) => { 
        this.bits = this.savesService.saves[value].bits; 
        this.cbit = this.savesService.saves[value].cbit; 
        this.numCBits = this.savesService.saves[value].numCBits; 
        this.numQBits = this.savesService.saves[value].numQBits; 
        this.canvasLength = this.savesService.saves[value].canvasLength; 
        this.initialized = true;
        this.recalcAllGateIdx();
      });
    }
    else{
      this.recalcAllGateIdx();
    }
  }

  setNewGate($event: any, bitIdx: number, spotIdx: number) {
    let newGate:Gate = $event.dragData;
    if(newGate && !newGate.isCouple()){
      this.bits[bitIdx].spots[spotIdx].gate = newGate;
      this.bits[bitIdx].spots[spotIdx].gate.couplingIdx = -1;
    }
    else{
      let coupledGate = this.savesService.getCoupledGate(newGate);
      coupledGate.couplingIdx = bitIdx;
      this.bits[bitIdx].spots[spotIdx].gate = newGate;
    }
    this.recalcAllGateIdx();
  }

  setNoGate($event: any, bitIdx: number, spotIdx: number) {
    if(this.bits[bitIdx].spots[spotIdx].gate.isBarrier()){
      this.clearSpot(spotIdx);
    }
    else{
      this.bits[bitIdx].spots[spotIdx].gate = new Gate();
    }
    this.recalcAllGateIdx();
  }

  setMeasurementConnectors(){
    for(let bitIdx = 0; bitIdx< this.bits.length; bitIdx++){
      for(let spotIdx = 0; spotIdx< this.bits[bitIdx].spots.length; spotIdx++){
        if(this.bits[bitIdx].spots[spotIdx].gate.isMeasurement()
        || this.bits[bitIdx].spots[spotIdx].gate.getLinks().length > 0){
          if(!this.bits[bitIdx].spots[spotIdx].gate.coupled)
            this.bits[bitIdx].spots[spotIdx].gate.line = "bottom";
          for(let i = bitIdx+1; i< this.bits.length; i++){
            if(!this.bits[i].spots[spotIdx].gate.isCouple()){
              this.bits[i].spots[spotIdx].gate = new Gate();
              this.bits[i].spots[spotIdx].gate.bitIdx = i;
              this.bits[i].spots[spotIdx].gate.spotIdx = spotIdx;
              this.bits[i].spots[spotIdx].gate.line = "both";
            }
          }
          if(this.bits[bitIdx].spots[spotIdx].gate.isMeasurement()){
            this.cbit.measurements[spotIdx].active = true;
            this.cbit.measurements[spotIdx].bit = this.bits[bitIdx].spots[spotIdx].gate.measurementBit;
            this.cbit.measurements[spotIdx].bit2 = this.bits[bitIdx].spots[spotIdx].gate.measurementBit2;
          }
          let links = this.bits[bitIdx].spots[spotIdx].gate.getLinks(); 
          if(links.length > 0){
            this.cbit.measurements[spotIdx].linked = true;
            this.cbit.measurements[spotIdx].bit = links[0];
            if(links.length > 1)this.cbit.measurements[spotIdx].bit2 = links[1];
          }
        }
        if(!this.spotLessThanMeasureGate(bitIdx, spotIdx)){
          this.bits[bitIdx].spots[spotIdx].showBg = false;
        }
        else{
          this.bits[bitIdx].spots[spotIdx].showBg = true;
        }
      }
    }
  }

  setBarriers(){
    for(let spotIdx = 0; spotIdx< this.bits[0].spots.length; spotIdx++){
      if(this.spotHasBarrier(spotIdx)){
        for(let bitIdx = 0; bitIdx< this.bits.length; bitIdx++){
          this.bits[bitIdx].spots[spotIdx].gate = new Gate(21, ""); 
        }
      }
    }
  }

  setCoupledConnectors(){
    for(let bitIdx = 0; bitIdx< this.bits.length; bitIdx++){
      for(let spotIdx = 0; spotIdx< this.bits[bitIdx].spots.length; spotIdx++){
        let gate:Gate = this.bits[bitIdx].spots[spotIdx].gate;
        if(gate.coupled && gate.couplingIdx >= 0){
          if(gate.couplingIdx > gate.bitIdx){
            for(let i = gate.bitIdx; i<= gate.couplingIdx; i++){
              if(i=== gate.bitIdx){
                this.bits[i].spots[spotIdx].gate.connector = "bottom";
              }
              else if (i === gate.couplingIdx){
                if(gate.double) this.bits[i].spots[spotIdx].gate = new Gate(18, "Couple");
                else this.bits[i].spots[spotIdx].gate = new Gate(19, "Couple");
                this.bits[i].spots[spotIdx].gate.bitIdx = gate.couplingIdx;
                this.bits[i].spots[spotIdx].gate.spotIdx = spotIdx;
                this.bits[i].spots[spotIdx].gate.connector = "top";
              }
              else{
                this.bits[i].spots[spotIdx].gate = new Gate();
                this.bits[i].spots[spotIdx].gate.connector = "both";
              }
            }
          }
          else if(gate.couplingIdx < gate.bitIdx){
            for(let i = gate.couplingIdx; i<= gate.bitIdx; i++){
              if(i=== gate.bitIdx){
                this.bits[i].spots[spotIdx].gate.connector = "top";
              }
              else if (i === gate.couplingIdx){
                if(gate.double) this.bits[i].spots[spotIdx].gate = new Gate(18, "Couple");
                else this.bits[i].spots[spotIdx].gate = new Gate(19, "Couple");
                this.bits[i].spots[spotIdx].gate.bitIdx = gate.couplingIdx;
                this.bits[i].spots[spotIdx].gate.spotIdx = spotIdx;
                this.bits[i].spots[spotIdx].gate.connector = "bottom";
              }
              else{
                this.bits[i].spots[spotIdx].gate = new Gate();
                this.bits[i].spots[spotIdx].gate.connector = "both";
              }
            }
          }
        }
      }
    }
  }

  allowDragFunction(bitIdx: number, spotIdx: number): any {
    return true;
  }

  allowDropFunction(bitIdx: number, spotIdx: number): any {
    return (dragData: any) => 
    this.bits[bitIdx].spots[spotIdx].gate.typeId === 0 
    && (dragData.isCouple() || this.bits[bitIdx].spots[spotIdx].gate.connector === "")
    && this.bits[bitIdx].spots[spotIdx].gate.line === ""
    && ((!dragData.isMeasurement() && this.spotLessThanMeasureGate(bitIdx, spotIdx)) 
      ||(dragData.isMeasurement() && !this.bitHasMeasureGate(bitIdx) && !this.spotHasLowerGate(bitIdx, spotIdx) && this.spotIsLastGate(bitIdx, spotIdx)))
    && (!dragData.coupled || this.savesService.getAllowedCouples(this.bits[bitIdx].spots[spotIdx].gate).length > 0)
    && (!dragData.isBarrier() || this.spotIsEmpty(spotIdx))
    && (!dragData.isCouple() || (spotIdx === dragData.spotIdx && this.savesService.getAllowedCouples(this.savesService.getCoupledGate(dragData)).indexOf(bitIdx) !== -1)); 
  }

  bitHasMeasureGate(bitIdx: number){
    for(let i = 0; i < this.bits[bitIdx].spots.length; i++){
      if(this.bits[bitIdx].spots[i].gate.isMeasurement()){
        return true;
      }
    }
    return false;
  }

  spotHasLowerGate(bitIdx: number, spotIdx: number){
    for(let i = bitIdx; i < this.bits.length; i++){
      if(this.bits[i].spots[spotIdx].gate.typeId !== 0){
        return true;
      }
    }
    return false;
  }

  spotHasBarrier(spotIdx: number){
    for(let i = 0; i < this.bits.length; i++){
      if(this.bits[i].spots[spotIdx].gate.typeId === 21){
        return true;
      }
    }
    return false;
  }

  spotIsEmpty(spotIdx: number){
    for(let i = 0; i < this.bits.length; i++){
      if(this.bits[i].spots[spotIdx].gate.typeId !== 0){
        return false;
      }
    }
    return true;
  }

  clearSpot(spotIdx: number){
    for(let i = 0; i < this.bits.length; i++){
      this.bits[i].spots[spotIdx].gate = new Gate();
    }
  }

  spotLessThanMeasureGate(bitIdx: number, spotIdx: number){
    for(let i = 0; i <= spotIdx; i++){
      if(this.bits[bitIdx].spots[i].gate.isMeasurement()){
        return false;
      }
    }
    return true;
  }

  spotIsLastGate(bitIdx: number, spotIdx: number){
    for(let i = spotIdx; i < this.bits[bitIdx].spots.length; i++){
      if(this.bits[bitIdx].spots[i].gate.typeId !== 0){
        return false;
      }
    }
    return true;
  }

  recalcAllGateIdx(){
    for(let bitIdx = 0; bitIdx< this.bits.length; bitIdx++){
      for(let spotIdx = 0; spotIdx< this.bits[bitIdx].spots.length; spotIdx++){
        let gate:Gate = this.bits[bitIdx].spots[spotIdx].gate;
        if(gate.isMeasurement() && gate.measurementBit >= this.numCBits-1){
          gate.measurementBit = this.numCBits-1;
        }
        else{
          gate.resetLinks(this.numCBits-1);
        }
        if(gate.typeId === 19 || gate.typeId === 18){
          this.bits[bitIdx].spots[spotIdx].gate = new Gate(); 
        }

        this.bits[bitIdx].spots[spotIdx].bitIdx = bitIdx;
        this.bits[bitIdx].spots[spotIdx].spotIdx = spotIdx;
        gate.bitIdx = bitIdx;
        gate.spotIdx = spotIdx;
        gate.connector = "";
        gate.line = "";

        if(bitIdx === 0){
          this.cbit.measurements[spotIdx].active = false;
          this.cbit.measurements[spotIdx].linked = false;
          this.cbit.measurements[spotIdx].bit = null;
          this.cbit.measurements[spotIdx].bit2 = null;
        }
      }
    }
    this.setMeasurementConnectors();
    this.setCoupledConnectors();
    this.setBarriers();
    this.save();
  }

  getDraggingClass(bitIdx: number, spotIdx: number){
    if(this.dragData && this.allowDropFunction(bitIdx,spotIdx)(this.dragData)){
      return "circle"
    }
    else {
      return "";
    }
  }

  showGateInfo($event: any, gate: Gate){
    this.gateInfo = [];
    for(let i = 0; i < gate.parameters.length; i++){
      let paramstring = "";
      paramstring += gate.parameters[i].name + "=";
      if(!gate.parameters[i].phaseMode){
        if(gate.parameters[i].a){
          if(gate.parameters[i].a.linkMode){
            paramstring += " a from Bit: " + (gate.parameters[i].a.link + 1).toString();
          }
          else{
            paramstring += " a: " + gate.parameters[i].a.value.toString();
          }
        }
        if(gate.parameters[i].b && gate.parameters[i].a){
          paramstring += ",";
        }
        if(gate.parameters[i].b){
          if(gate.parameters[i].b.linkMode){
            paramstring += " b from Bit: " + (gate.parameters[i].b.link + 1).toString();
          }
          else{
            paramstring += " b: " + gate.parameters[i].b.value.toString();
          }
        }
      }
      else if(gate.parameters[i].phaseMode){
        if(gate.parameters[i].r){
          if(gate.parameters[i].r.linkMode){
            paramstring += " r from Bit: " + (gate.parameters[i].r.link + 1).toString();
          }
          else{
            paramstring += " r: " + gate.parameters[i].r.value.toString();
          }
        }
        if(gate.parameters[i].r && gate.parameters[i].phi){
          paramstring += ",";
        }
        if(gate.parameters[i].phi){
          if(gate.parameters[i].phi.linkMode){
            paramstring += " φ from Bit: " + (gate.parameters[i].phi.link +1).toString();
          }
          else{
            paramstring += " φ: " + gate.parameters[i].phi.value.toString();
          }
        }
      }
      this.gateInfo.push(paramstring);
    }
    if(gate.isMeasurement()){
      if(gate.measurementType === 1 && gate.measurementQuad === 0){
        this.gateInfo.push("Homodyne X");
      }
      else if(gate.measurementType === 1 && gate.measurementQuad === 1){
        this.gateInfo.push("Homodyne P");
      }
      else if(gate.measurementType === 1 && gate.measurementQuad === 2){
        this.gateInfo.push("Homodyne 2π • " + gate.measurementAngle);
      }
      else if(gate.measurementType === 0){
        this.gateInfo.push("Fock");
      }
      else if(gate.measurementType === 2){
        this.gateInfo.push("Heterodyne " );
      }
      this.gateInfo.push(" to Bit: " + (gate.measurementBit + 1).toString());
      if(gate.measurementType === 2){
        this.gateInfo.push(" and Bit: " + (gate.measurementBit2 + 1).toString());
      }
    }
  }

  showQBitInfo($event: any, qbit: QBit){
    this.gateInfo = [];
    for(let i = 0; i < qbit.parameters.length; i++){
      let paramstring = "";
      if(qbit.parameters[i].phaseMode !== undefined){
        paramstring += qbit.parameters[i].name + "=";
        if(qbit.parameters[i].phaseMode){
          paramstring += " r: " + qbit.parameters[i].r.toString();
          paramstring += ", φ: " + qbit.parameters[i].phi.toString();
        }
        else{
          paramstring += " a: " + qbit.parameters[i].a.toString();
          paramstring += ", b: " + qbit.parameters[i].b.toString();
        }
      }
      if(qbit.parameters[i].n !== undefined){
        paramstring += "Fock State= ";
        paramstring += qbit.parameters[i].n.toString();
      }
      this.gateInfo.push(paramstring);
    }
  }

  hideGateInfo($event: any){
    this.gateInfo = [];
  }

  setDragging($event: any, gate: Gate){
    this.draggingData.emit(gate);
  }

  setNotDragging($event: any){
    this.draggingData.emit(null);
  }

  preventDefault(event) {
    event.mouseEvent.preventDefault();
    return false;
  }

  save(){
    this.savesService.saves[this.savesService.currentSave].bits = this.bits;
    this.savesService.saves[this.savesService.currentSave].lastModified = new Date();
    this.savesService.saveChanged();
  }
}

