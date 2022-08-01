import { Pointer, Runtime, RAII, RAIIValueT } from './memory';

interface StructField<T> extends RAII<T> {
    align: number;
}

type InitValues<T> = {
    [P in keyof T]: RAIIValueT<T[P]>;
};

type FielfReturnType<T, K extends keyof T> = InitValues<T>[K];

type StructDef<T> = {
    [P in keyof T]: StructField<RAIIValueT<T[P]>>;
};
type Struct<T extends Record<string, any>> = RAII<InitValues<T>> & {
    size: number;
    get<K extends keyof T>(
        r: Runtime,
        ref: Pointer,
        field: K
    ): FielfReturnType<T, K>;
    set<K extends keyof T>(
        r: Runtime,
        ref: Pointer,
        field: K,
        value: FielfReturnType<T, K>
    ): void;
};

export function defineStruct<T extends Record<string, RAII<any>>>(
    definition: T
): Struct<T> {
    let align = 0;
    let size = 0;
    const def = Object.keys(definition).reduce((acc, field) => {
        const fieldSize = definition[field].size;
        // @ts-ignore
        acc[field] = {
            ...definition[field],
            align,
        };
        align += fieldSize;
        size += fieldSize;

        return acc;
    }, {} as StructDef<T>);

    return {
        size,
        toBytes(initials) {
            return Object.keys(initials).reduce((acc, field) => {
                const initialValue = initials[field];
                const { toBytes, size, align } = def[field];

                const fieldBytes = toBytes(initialValue);

                for (let i = 0; i < size; i += 1) {
                    acc[align + i] = fieldBytes[i];
                }

                return acc;
            }, new Array(size).fill(0));
        },
        fromBytes(bytes) {
            let align = 0;
            return Object.keys(definition).reduce((acc, field) => {
                const fieldSize = definition[field].size;

                acc[field] = definition[field].fromBytes(
                    bytes.slice(align, align + fieldSize)
                );
                align += fieldSize;

                return acc;
            }, {}) as InitValues<T>;
        },
        get(r, ptr, field) {
            return def[field].fromBytes(
                r.read(Pointer.stack(def[field], ptr.head + def[field].align))
            ) as any;
        },
        set(r, ptr, field, value) {
            const fieldBuffer = Pointer.stack(
                def[field],
                ptr.head + def[field].align
            );
            r.write(fieldBuffer, def[field].toBytes(value));
        },
        copy(r, bytes) {
            let align = 0;
            return Object.keys(definition).reduce((acc, field) => {
                const fieldSize = definition[field].size;
                const copy = definition[field].copy(
                    r,
                    bytes.slice(align, align + fieldSize)
                );

                align += fieldSize;

                return acc.concat(copy);
            }, [] as number[]);
        },
        destroy() {
            Object.keys(definition).forEach((field) => {
                def[field].destroy();
            });
        },
    };
}
