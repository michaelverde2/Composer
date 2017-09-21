export class Gate {
    //gate type
    typeId: number;
    typeName: string;
    icon: string = "";
    description: string;
    conjugate: boolean;

    //gate couple/ connectors
    coupled: boolean = false;
    couplingIdx: number = -1;
    connector: string;
    line: string;
    double: boolean;

    //gate settings 
    parameters: GateParameter[] = [];

    //measurment settings
    measurementType: number = 0;
    measurementInt: number = 0;
    measurementBit: number = 0;

    //remeber if the settings modal has been openened
    modalOpened = false;

    //gate location
    bitIdx: number; 
    spotIdx: number; 

    constructor(typeId?: number, typeName?: string){
        typeId ? this.typeId = typeId : this.typeId = 0;
        typeName ? this.typeName = typeName : this.typeName = "";

        this.bitIdx = -1;
        this.spotIdx = -1;
        this.conjugate = false;

        if(typeId === 20){
            this.measurementType = 1;
            this.icon = "dashboard";
        }

        //Set Up Parameters
        if([1,12].indexOf(typeId) !== -1){
            this.parameters.push(new GateParameter("Squeezing Factor", 0, 0, null, null));
        }
        if([2].indexOf(typeId) !== -1){
            this.parameters.push(new GateParameter("Displacement", 0, 0, null, null));
        }
        if([3,4,5].indexOf(typeId) !== -1){
            this.parameters.push(new GateParameter("Value", 0, null, null, null));
        }
        if([7,8,10,11,14].indexOf(typeId) !== -1){
            this.parameters.push(new GateParameter("Phase", null, null, null, 0));
        }
        if([11].indexOf(typeId) !== -1){
            this.parameters.push(new GateParameter("Transmittivity", 0, null, null, null));
        }

        //Set Up Coupling
        if([10,13].indexOf(typeId) !== -1){
            this.coupled = true;
            this.connector = "top";
        }
        if([11,12].indexOf(typeId) !== -1){
            this.double = true;
        }
    }

    isMeasurement():boolean{
        return this.typeId === 20;
    }

    getLink():number{
        for(let i = 0; i<this.parameters.length; i++){
            if(this.parameters[i].phaseMode){
                if (this.parameters[i].r !== undefined && this.parameters[i].r.linkMode)
                    return this.parameters[i].r.link;
                else if (this.parameters[i].phi !== undefined && this.parameters[i].phi.linkMode)
                    return this.parameters[i].phi.link;
            }
            else if (!this.parameters[i].phaseMode){
                if (this.parameters[i].a !== undefined && this.parameters[i].a.linkMode)
                    return this.parameters[i].a.link;
                else if (this.parameters[i].b !== undefined && this.parameters[i].b.linkMode)
                    return this.parameters[i].b.link;
            }
        }
        return -1;
    }

    isCouple():boolean{
        return this.typeId === 19;
    }

    public static serialize(gate: Gate): Gate{
        let g = new Gate(gate.typeId, gate.typeName);
        g.icon = gate.icon;
        g.description = gate.description;
        g.conjugate = gate.conjugate;
    
        //gate couple/ connectors
        g.coupled = gate.coupled;
        g.couplingIdx = gate.couplingIdx;
        g.connector = gate.connector;
        g.line = gate.line;
        g.double = gate.double;
    
        //gate settings 
        gate.parameters.forEach(parameter => {
            g.parameters.push(new GateParameter(
                parameter.name, 
                parameter.a === undefined ? null : parameter.a.value, 
                parameter.b === undefined ? null : parameter.b.value, 
                parameter.r === undefined ? null : parameter.r.value, 
                parameter.phi === undefined ? null : parameter.phi.value));
        });
    
        //measurment settings
        g.measurementType = gate.measurementType;
        g.measurementInt = gate.measurementInt;
        g.measurementBit = gate.measurementBit;
    
        //remeber if the settings modal has been openened
        g.modalOpened = gate.modalOpened;
    
        //gate location
        g.bitIdx = gate.bitIdx;
        g.spotIdx = gate.spotIdx;
        return g;
    }
  }

  export class GateParameter{
      name: string;
      phaseMode: boolean;
      a: GateParameterItem;
      b: GateParameterItem;
      r: GateParameterItem;
      phi: GateParameterItem;

      constructor(name: string, a: number, b :number, r :number, phi :number){
        this.name = name;
        if(a !== null)this.a = new GateParameterItem(a);
        if(b !== null)this.b = new GateParameterItem(b);
        if(r !== null)this.r = new GateParameterItem(r);
        if(phi !== null)this.phi = new GateParameterItem(phi);

        if(a !== null || b !== null){
            this.phaseMode = false;
        }
        else{
            this.phaseMode = true;
        }
      }
  }

  export class GateParameterItem{
      value: number;
      link: number;
      linkMode: boolean = false;

      constructor(value: number){
        this.value = value;
      }
  }


  