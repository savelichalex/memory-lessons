// https://en.wikipedia.org/wiki/Rule_of_three_%28C++_programming%29
export interface RAII<T = any> {
    // create(value: T): number[];
    toBytes(val: T): number[];
    fromBytes(bytes: number[]): T;
    copy(r: Runtime, bytes: number[]): number[];
    destroy(): void;
    size: number;
}

export type RAIIValueT<T> = T extends RAII<infer U> ? U : never;

type Int = RAII<number>;

export const int_t: Int = {
    toBytes(n) {
        return [n];
    },
    fromBytes(bytes) {
        return bytes[0];
    },
    copy(_r, bytes) {
        return bytes;
    },
    destroy() {},
    size: 1,
};

enum PointerType {
    Stack,
    Heap,
    Null,
}

export class Pointer<D extends RAII = any> {
    public head: number;
    public size: number;
    protected def: D;
    protected type: PointerType;

    constructor(def: D, head: number, type: PointerType) {
        this.head = head;
        this.size = def.size;
        this.def = def;
        this.type = type;
    }

    static stack<D extends RAII>(def: D, head: number) {
        return new Pointer(def, head, PointerType.Stack);
    }

    static heap<D extends RAII>(def: D, head: number) {
        return new Pointer(def, head, PointerType.Heap);
    }

    static null<D extends RAII>(def: D) {
        return new Pointer(def, -1, PointerType.Null);
    }

    static of<D extends RAII>(def: D, head: number, type: PointerType) {
        switch (type) {
            case PointerType.Stack:
                return Pointer.stack(def, head);
            case PointerType.Heap:
                return Pointer.heap(def, head);
            case PointerType.Null:
                return Pointer.null(def);
        }
    }

    static size() {
        return 2;
    }

    isOnStack() {
        return this.type === PointerType.Stack;
    }

    isOnHeap() {
        return this.type === PointerType.Heap;
    }

    isNull() {
        return this.type === PointerType.Null;
    }

    bytes() {
        return [this.head, this.type];
    }

    copy(r: Runtime) {
        if (this.type === PointerType.Null) {
            throw "Can't copy nullptr";
        }

        // Don't need to do full copy on the heap pointer
        if (this.type === PointerType.Heap) {
            return this;
        }

        const copiedBytes = this.def.copy(r, r.read(this));

        let ptr = this.newStackPtr(r);

        r.write(ptr, copiedBytes);

        this.head = -1;
        this.type = PointerType.Null;

        return ptr;
    }

    private newStackPtr(r: Runtime) {
        const address = r.salloc(this.def.size);

        if (address == null) {
            throw 'Not-enough memory';
        }

        return Pointer.stack(this.def, address);
    }

    private newHeapPtr(r: Runtime) {
        const address = r.malloc(this.def.size);

        if (address == null) {
            throw 'Not-enough memory';
        }

        return Pointer.heap(this.def, address);
    }
}

export function pointer_t<D extends RAII>(def: D): RAII<Pointer<D>> {
    const toBytes = (ptr: Pointer<D>) => ptr.bytes();
    const fromBytes = (bytes: number[]) => {
        if (bytes.length !== Pointer.size()) {
            throw 'Not a pointer';
        }
        const [head, type] = bytes;

        return Pointer.of(def, head, type);
    };
    return {
        toBytes,
        fromBytes,
        copy(r, bytes) {
            const ptr = fromBytes(bytes);
            const newPtr = ptr.copy(r);

            return newPtr.bytes();
        },
        destroy() {
            def.destroy();
        },
        size: Pointer.size(),
    };
}

export interface Reference<D extends RAII> {
    get(r: Runtime): D;
    deref(): Pointer<D>;
}

class ReferenceImpl<D extends RAII, V extends Pointer<D>>
    implements Reference<D>
{
    protected def: D;
    protected ptr: V;

    constructor(def: D, ptr: V) {
        this.def = def;
        this.ptr = ptr;
    }

    get(r) {
        return this.def.fromBytes(r.read(this.ptr));
    }

    deref() {
        return this.ptr;
    }

    release() {
        this.def.destroy();
    }
}

type Scope = {
    stackRegister: number;
    refs: Set<Reference<any>>;
    prev: Scope | null;
};

export class Runtime {
    private ram: number[] = new Array(4 * 1024).fill(0);

    write(ptr: Pointer, bytes: number[]) {
        for (let i = 0; i < ptr.size; i += 1) {
            this.ram[ptr.head + i] = bytes[i];
        }
    }

    read(ptr: Pointer) {
        return new Array(ptr.size)
            .fill(null)
            .map((_, i) => this.ram[ptr.head + i]);
    }

    free(ptr: Pointer) {
        for (let i = 0; i < ptr.size; i += 1) {
            this.ram[ptr.head + i] = 0;
        }
    }

    // 1024 bytes for stack variables
    private stackRegister = 0;

    // MARK:- Stack allocation

    salloc(size: number): number | null {
        const address = this.stackRegister;

        if (this.stackRegister + size >= this.heapStartRegister) {
            return null;
        }

        this.stackRegister = this.stackRegister + size;

        return address;
    }

    static<D extends RAII>(def: D, value: RAIIValueT<D>): Reference<D> {
        const bytes = def.toBytes(value);
        const size = bytes.length;

        const address = this.salloc(size);

        if (address == null) {
            throw 'Not-enough memory';
        }

        const ptr = Pointer.stack(def, address);

        this.write(ptr, bytes);

        return this.makeRef(def, ptr);
    }

    debugStack(start: number = 0, end: number = this.heapStartRegister) {
        console.log('----- STACK DUMP START -------');
        console.log(this.ram.slice(start, end));
        console.log('----- STACK DUMP END ---------');
    }

    // MARK:- Heap allocation

    // 3 * 1024 for the heap
    private heapStartRegister = 1024;
    private heapFreeRegisters = new Array(3 * 1024).fill(true);

    /**
     * @param size number of bites to allocate
     */
    malloc(size: number): number | null {
        let i = this.heapStartRegister;
        let k = 1;
        for (; i <= this.ram.length; i += 1) {
            if (this.heapFreeRegisters[i - this.heapStartRegister]) {
                if (k === size) {
                    break;
                }
                k += 1;
                continue;
            }
            k = 1;
        }

        if (k < size) {
            return null;
        }

        const address = i - k + 1;

        for (let j = address; j < address + size; j += 1) {
            this.heapFreeRegisters[j - this.heapStartRegister] = false;
        }

        return address;
    }

    new<D extends RAII>(def: D, value: RAIIValueT<D>): Reference<D> {
        const bytes = def.toBytes(value);
        const size = bytes.length;
        const freeMemoryAddress = this.malloc(size);

        if (freeMemoryAddress == null) {
            throw 'Not-enough memory';
        }

        const ptr = Pointer.heap(def, freeMemoryAddress);

        this.write(ptr, bytes);

        return this.makeRef(def, ptr);
    }

    debugHeap(
        start: number = 0,
        end: number = this.ram.length - this.heapStartRegister
    ) {
        console.log('----- HEAP DUMP START --------');
        console.log(
            this.ram.slice(
                start + this.heapStartRegister,
                end + this.heapStartRegister
            )
        );
        console.log('----- HEAP DUMP END ----------');
    }

    debugFreeHeap(
        start: number = 0,
        end: number = this.heapFreeRegisters.length
    ) {
        console.log(this.heapFreeRegisters.slice(start, end));
    }

    // MARK:- execution

    private scope: Scope | null = {
        stackRegister: 0,
        refs: new Set(),
        prev: null,
    };

    call<C extends (...args: any[]) => Reference<any> | void>(
        fn: C,
        ...args: CbArgs<C>
    ): CbRet<C> {
        const newScope: Scope = {
            stackRegister: this.stackRegister,
            refs: new Set(),
            prev: this.scope,
        };
        this.scope = newScope;

        let result = fn(...args) as CbRet<C>;

        const prevStackRegister = this.stackRegister;
        this.stackRegister = this.scope.stackRegister;

        if (result instanceof ReferenceImpl && this.scope.refs.has(result)) {
            const ptr = result.deref();

            if (ptr.isOnStack()) {
                const ptrCopy = ptr.copy(this);

                // TODO: what's wrong with types?
                result = new ReferenceImpl(
                    (ptrCopy as any).def,
                    ptrCopy
                ) as any;
                this.scope.prev?.refs.add(result as any);
            }
        }

        // RAII scope based cleanup
        this.scope.refs.forEach((ref) => {
            if (ref instanceof ReferenceImpl) {
                ref.release();
            }
        });

        // clean stack and move
        this.free(
            Pointer.stack(
                { size: prevStackRegister - this.stackRegister } as any,
                this.stackRegister
            )
        );

        this.scope = this.scope.prev;

        return result;
    }

    private makeRef<D extends RAII, T extends Pointer<D>>(
        def: D,
        ptr: T
    ): Reference<D> {
        const ref = new ReferenceImpl(def, ptr);
        this.scope?.refs.add(ref);
        return ref;
    }
}

type CbArgs<T> = T extends (...args: infer U) => any ? U : never;
type CbRet<T> = T extends (...args: any) => infer R ? R : never;
