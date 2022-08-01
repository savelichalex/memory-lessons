import { free, link, malloc, read, write } from './memory';

type StructFieldMaker = (val: any, size: number) => number[];

type StructDef = Record<
    string,
    {
        make: StructFieldMaker;
        size: number;
    }
>;
type Struct<T extends StructDef> = Record<
    keyof T,
    { size: number; align: number; make: StructFieldMaker }
> & {
    size: number;
};

export function defineStruct<T extends StructDef>(definition: T): Struct<T> {
    let align = 0;
    return Object.keys(definition).reduce(
        (acc, field) => {
            const fieldSize = definition[field].size;
            // @ts-ignore
            acc[field] = {
                make: definition[field].make,
                size: fieldSize,
                align,
            };
            align += fieldSize;
            acc.size += fieldSize;

            return acc;
        },
        { size: 0 } as Struct<T>
    );
}

export function createStruct<T extends StructDef>(
    struct: Struct<T>,
    initials: Record<keyof T, any>
) {
    return Object.keys(initials).reduce((acc, field) => {
        const initialValue = initials[field];
        const { make, size, align } = struct[field];

        const fieldBytes = make(initialValue, size);

        for (let i = 0; i < size; i += 1) {
            acc[align + i] = fieldBytes[i];
        }

        return acc;
    }, new Array(struct.size).fill(0));
}

export function allocStruct<T extends StructDef>(
    struct: Struct<T>,
    initials: Record<keyof T, any>
) {
    const structBytes = createStruct(struct, initials);
    const structBuffer = malloc(struct.size);

    if (structBuffer == null) {
        return null;
    }

    write(structBuffer, structBytes);

    return structBuffer.headAddress;
}

export function structGet<T extends StructDef>(
    struct: Struct<T>,
    address: number | null,
    field: keyof T
): number[] | [null] {
    if (address == null) {
        return [null];
    }
    return read(address + struct[field].align, struct[field].size);
}

export function structSet<T extends StructDef>(
    struct: Struct<T>,
    address: number,
    field: keyof T,
    value: number[]
): void {
    const fieldBuffer = link(address + struct[field].align, struct[field].size);
    write(fieldBuffer, value);
}

export function newStruct<T extends StructDef>() {
    return {
        struct: null,
        constructor(struct: Struct<T>, initials: Record<keyof T, any>) {
            this.struct = struct;
            return allocStruct(struct, initials);
        },
        destructor(address: number | null) {
            if (address == null) {
                return void 0;
            }

            free(address, this.struct.size);
        },
    };
}
