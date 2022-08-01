type Struct<T extends Record<string, number>> = Record<
    keyof T,
    { size: number; align: number }
> & { size: number };

export function defineStruct<T extends Record<string, number>>(
    definition: T
): Struct<T> {
    let align = 0;
    return Object.keys(definition).reduce(
        (acc, field) => {
            const fieldSize = definition[field];
            // @ts-ignore
            acc[field] = {
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
