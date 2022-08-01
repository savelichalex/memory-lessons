import { debugFreeHeap, debugHeap, free, pointer_t } from './memory';
import { allocStruct, defineStruct, structGet, structSet } from './struct';

function int_t() {
    return {
        make: (val: number) => [val],
        size: 1,
    };
}

const refStruct = defineStruct({
    value: pointer_t(),
    counter: int_t(),
});

type Scope = {
    refs: Set<number>;
    prev: Scope | null;
};

let scope: Scope | null = {
    refs: new Set(),
    prev: null,
};

const destructorsMap: Record<number, Function> = {};

export function call(fn: Function, ...args: any[]) {
    const newScope = {
        refs: args.reduce((acc, argument) => {
            // Need to grab all refs that were passed
            if (scope?.refs.has(argument)) {
                grabRef(argument);
                acc.add(argument);
            }
            return acc;
        }, new Set()),
        prev: scope,
    };
    scope = newScope;

    const result = fn.apply(null, args);

    if (scope.refs.has(result)) {
        // It's a ref, need to grab it
        grabRef(result);
        // and since it's assigned to the upper scope need to push it there too
        // if it wasn't already there
        scope.prev?.refs.add(result);
    }

    scope.refs.forEach(releaseRef);

    scope = scope.prev;
    return result;
}

export function ref<T>(
    newThingClass: () => {
        constructor(...args: T): number | null;
        destructor(address: number | null): void;
    },
    ...args: T
): number | null {
    const newThing = newThingClass();
    const thing = newThing.constructor.apply(newThing, args);

    if (thing == null) {
        return null;
    }

    destructorsMap[thing] = newThing.destructor.bind(newThing);

    const ref = allocStruct(refStruct, {
        value: thing,
        counter: 1,
    });

    if (ref == null) {
        return null;
    }

    scope?.refs.add(ref);

    return ref;
}

function grabRef(refAddress: number | null) {
    if (refAddress == null) {
        return;
    }
    const counter = structGet(refStruct, refAddress, 'counter')[0];
    structSet(refStruct, refAddress, 'counter', [counter + 1]);
}

function releaseRef(refAddress: number | null) {
    if (refAddress == null) {
        return;
    }
    const boxedAddress = structGet(refStruct, refAddress, 'value')[0];
    const counter = structGet(refStruct, refAddress, 'counter')[0] - 1;

    if (counter > 0) {
        structSet(refStruct, refAddress, 'counter', [counter]);
        return;
    }

    destructorsMap[boxedAddress]?.(boxedAddress);
    free(refAddress, refStruct.size);
}

export function refGet(refAddress: number | null): number | null {
    if (refAddress == null) {
        return null;
    }
    return structGet(refStruct, refAddress, 'value')[0];
}
