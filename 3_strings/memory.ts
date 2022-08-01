let ram: number[] = new Array(4 * 1024).fill(0);

// 1024 bytes for stack variables
let stackRegister = 0;
// 3 * 1024 for the heap
let heapRegister = 1024;

const heapFreeRegisters = new Array(3 * 1024).fill(true);

class Buffer {
    readonly size: number;
    readonly headAddress: number;

    constructor(address: number, size: number) {
        this.headAddress = address;
        this.size = size;
    }
}

/**
 *
 * @param size number of bites to allocate
 */
export function malloc(size: number) {
    let i = heapRegister;
    let k = 1;
    for (; i <= ram.length; i += 1) {
        if (k === size) {
            break;
        }
        if (heapFreeRegisters[i - heapRegister]) {
            k += 1;
            continue;
        }
        k = 1;
    }

    if (k < size) {
        return null;
    }

    const address = i - k + 1;

    const b = new Buffer(address, size);

    for (let j = b.headAddress; j < b.headAddress + size; j += 1) {
        heapFreeRegisters[j - heapRegister] = false;
    }

    return b;
}

export function link(address: number, size: number) {
    return new Buffer(address, size);
}

class Pointer {
    readonly head: number;
    readonly size: number;
}

export function write(buffer: Buffer, contents: number[]) {
    for (let i = 0; i < buffer.size; i += 1) {
        ram[buffer.headAddress + i] = contents[i];
    }
}

export function read(address: number, size: number) {
    return new Array(size).fill(null).map((_, i) => ram[address + i]);
}

export function free(address: number, size: number) {
    for (let i = 0; i < size; i += 1) {
        ram[address + i] = 0;
    }
}

export function debugHeap(
    start: number = 0,
    end: number = ram.length - heapRegister
) {
    console.log(ram.slice(start + heapRegister, end + heapRegister));
}

export function debugFreeHeap(
    start: number = 0,
    end: number = heapFreeRegisters.length
) {
    console.log(heapFreeRegisters.slice(start, end));
}
