/**
 * LS-8 v2.0 emulator skeleton code
 */

const fs = require('fs');

// Instructions

const HLT = 0b00000001; // Halt CPU
const ADD = 0b10101000; // ADD R R
const MUL = 0b10101010; // MUL R R
const LDI = 0b10011001; // LDI R I
const PRN = 0b01000011; // PRN
const POP = 0b01001100; // Pop R
const PUSH = 0b01001101; // Push R
const CALL = 0b01001000;
const RET = 0b00001001;
const AND = 0b10110011;
const NOP = 0b00000000;
const INC = 0b01111000;
const DEC = 0b01111001;
const DIV = 0b10101011;
const CMP = 0b10100000;
const JEQ = 0b01010001;
const JNE = 0b01010010;
const JMP = 0b01010000;
const MOD = 0b10101100;
const NOT = 0b01110000;
const OR = 0b10110001;
const SUB = 0b10101001;
const XOR = 0b10110010;

/**
 * Class for simulating a simple Computer (CPU & memory)
 */
class CPU {

    /**
     * Initialize the CPU
     */
    constructor(ram) {
        this.ram = ram;

        this.reg = new Array(8).fill(0); // General-purpose registers

        this.reg[SP] = 0xf4;
        
        // Special-purpose registers
        this.reg.PC = 0; // Program Counter
        this.reg.IR = 0; // Instruction Register

		this.setupBranchTable();
    }
	
	/**
	 * Sets up the branch table
	 */
	setupBranchTable() {
		let bt = {};

        bt[HLT] = this.HLT;
        bt[ADD] = this.ADD;
        bt[MUL] = this.MUL;
        bt[LDI] = this.LDI;
        bt[PRN] = this.PRN;
        bt[POP]  = this.POP;
        bt[PUSH] = this.PUSH;
        bt[CALL] = this.CALL;
        bt[RET]  = this.RET;
        bt[AND] = this.AND;
        bt[NOP] = this.NOP;
        bt[INC] = this.INC;
        bt[DEC] = this.DEC;
        bt[DIV] = this.DIV; 
        bt[CMP] = this.CMP;
        bt[JEQ] = this.JEQ;
        bt[JMP] = this.JMP;
        bt[JNE] = this.JNE;
        bt[MOD] = this.MOD;
        bt[NOT] = this.NOT
        bt[OR] = this.OR;
        bt[SUB] = this.SUB;
        bt[XOR] = this.XOR;

		this.branchTable = bt;
	}

    /**
     * Store value in memory address, useful for program loading
     */
    poke(address, value) {
        this.ram.write(address, value);
    }

    /**
     * Starts the clock ticking on the CPU
     */
    startClock() {
        const _this = this;

        this.clock = setInterval(() => {
            _this.tick();
        }, 1);
    }

    /**
     * Stops the clock
     */
    stopClock() {
        clearInterval(this.clock);
    }

    /**
     * ALU functionality
     * 
     * op can be: ADD SUB MUL DIV INC DEC CMP
     */
    alu(op, regA, regB) {
        switch (op) {
            case 'ADD':
                this.reg[regA] = this.reg[regA] + this.reg[regB];
                break;
            case 'MUL':
                this.reg[regA] = this.reg[regA] * this.reg[regB];
                break;
            case 'AND':
                this.reg[regA] = this.reg[regA] & this.reg[regB];
                break;
            case 'INC':
                this.reg[regA] = (this.reg[regA] + 1) & 0xff;
                break;
            case 'DEC':
                this.reg[regA] -= 1;
                break;
            case 'DIV':
                if (this.reg[regB] === 0) {
                    console.error('Divider cannot be zero', this.reg[regB]);
                    this.HLT();
                }
                this.reg[regA] = this.reg[regA] / this.reg[regB];
                break;
            case 'CMP':
                if (this.reg[regA] === this.reg[regB]) {
                    this.reg.FL = this.reg.FL | 0b00000001;
                }
                if (this.reg[regA] > this.reg[regB]) {
                    this.reg.FL = this.reg.FL | 0b00000010;
                }
                if (this.reg[regA] < this.reg[regB]) {
                    this.reg.FL = this.reg.FL | 0b00000100;
                }
                break;
            case 'MOD':
                if (this.reg[regB] === 0) {
                    console.error('Divder cannot be zeor', this.reg[regB]);
                    this.HLT();
                }
                this.reg[regA] = this.reg[regA] % this.reg[regB];
                break;
            case 'NOT':
                this.reg[regA] = ~this.reg[regA];
                break;
            case 'OR':
                this.reg[regA] = this.reg[regA] | this.reg[regB];
                break;
            case 'SUB':
                this.reg[regA] = this.reg[regA] - this.reg[regB];
                break;
            case 'XOR':
                this.reg[regA] = this.reg[regA] ^ this.reg[regB];
                break;
        }
    }

    /**
     * Advances the CPU one cycle
     */
    tick() {
        // Load the instruction register (IR) from the current PC
        // !!! IMPLEMENT ME
        this.reg.IR = this.ram.read(this.reg.PC);

        // Debugging output
        // console.log(`${this.reg.PC}: ${this.reg.IR.toString(2)}`);

        // Based on the value in the Instruction Register, locate the
        // appropriate hander in the branchTable
        let handler = this.branchTable[this.reg.IR];

        // Check that the handler is defined, halt if not (invalid
        // instruction)
        if (handler === undefined) {
            console.error('Unknown opcode ' + this.reg.IR);
            this.stopClock(); // exit emulator
            return;
        }

        // Read OperandA and OperandB
        let operandA = this.ram.read(this.reg.PC + 1);
        let operandB = this.ram.read(this.reg.PC + 2);

        // We need to use call() so we can set the "this" value inside
        // the handler (otherwise it will be undefined in the handler)
        let nextPC = handler.call(this, operandA, operandB);
        if (nextPC !== undefined) {
            this.reg.PC = nextPC;
        } else {
            // Increment the PC register to go to the next instruction
            this.reg.PC += ((this.reg.IR >> 6) & 0b00000011) + 1;
        }

    }

    // INSTRUCTION HANDLER CODE:

    /**
     * ADD R R
     */
    ADD(regA, regB) {
        this.alu('ADD', regA, regB);
    }

    /**
     * HLT
     */
    HLT() {
        this.stopClock();
    }

    /**
     * LDI R,I
     */
    LDI(regNum, value) {
        this.reg[regNum] = value;
    }

    /**
     * MUL R,R
     */
    MUL(regA, regB) {
        this.alu('MUL', regA, regB);
    }

    _pop() {
    const val = this.ram.read(this.reg[SP]);

    // Increment SP, stack grows down from address 255
    this.alu('INC', SP);

    return val;
  }

    /**
     * POP R
     */
    POP(regA) {
        this.reg[regA] = this._pop();
    }

    _push(val) {
        // Decrement SP, stack grows down from address 0xF7
        this.alu('DEC', SP);

        // Store value at the current SP
        this.ram.write(this.reg[SP], val);
    }

    /**
     * PUSH R
     */
    PUSH(regA) {
        this._push(this.reg[regA]);
    }

    CALL(regA) {
        return this.reg[regA];
    }
    
    RET() {
        const value = this._pop();
        return value
    }

    AND(regA, regB) {
        this.alu('AND', regA, regB);
    }

    NOP() {
        return undefined;
    }

    INC(regA) {
        this.alu('INC', regA);
    }

    DEC(regA) {
        this.alu('DEC', regA);
    }

    DIV(regA, regB) {
        this.alu('DIV', regA, regB);
    }

    CMP(regA, regB) {
        this.alu('CMP', regA, regB);
    }

    JEQ(regA) {
        if (this.reg.FL === 1) {
            return this.reg[regA];
        }
    }

    JMP(regA) {
       return this.reg[regA];
   }

    JNE(regA) {
        if (this.reg.FL === 0) {
            return this.reg[regA];
        }
    }

    MOD(regA, regB) {
        this.alu('MOD', regA, regB);
    }

    NOT(regA) {
        this.alu('NOT', regA);
    }

    OR(regA, regB) {
        this.alu('OR', regA, regB);
    }

    SUB(regA, regB) {
        this.alu('SUB', regA, regB);
    }

    XOR(regA, regB) {
        this.alu('XOR', regA, regB);
    }

    /**
     * PRN R
     */
    PRN(regA) {
        console.log(this.reg[regA]);
    }
}

module.exports = CPU;
