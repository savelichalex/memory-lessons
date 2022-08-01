import { char_t, debugChar, str } from './char';
import { allocStruct, defineStruct, structGet, structSet } from './struct';

function pointer_t() {
    return {
        make: (pointer: number) => [pointer],
        size: 1,
    };
}

const dynamicStringListNode = defineStruct({
    value: pointer_t(), // char_t
    head: pointer_t(),
    next: pointer_t(),
});

function makeDynamicString(content: number[]) {
    // TODO: str.length === 0

    const head = allocStruct(dynamicStringListNode, {
        value: content[0],
        head: 0,
        next: 0,
    });

    if (head == null) {
        return null;
    }

    let currentNode = head;

    for (let i = 1; i < content.length; i += 1) {
        const nextSymbolNode = allocStruct(dynamicStringListNode, {
            value: content[i],
            head: 0,
            next: 0,
        });

        if (nextSymbolNode == null) {
            // TODO: probably it's a good idea to `free` all previously allocated nodes here
            return null;
        }

        structSet(dynamicStringListNode, currentNode, 'next', [nextSymbolNode]);

        currentNode = nextSymbolNode;
    }

    return head;
}

export function dynamicString(s: string) {
    return makeDynamicString(str(s));
}

export function dynamicString_t() {
    return pointer_t();
}

export function readDynamicString(address: number) {
    const result: number[] = [];

    let next = address;

    while (next != 0) {
        const nodeValue = structGet(dynamicStringListNode, next, 'value')[0];
        const nextNode = structGet(dynamicStringListNode, next, 'next')[0];

        result.push(nodeValue);

        next = nextNode;
    }

    return result;
}

export function dynamicStrcat(str1: number | null, str2: number | null) {
    if (str1 == null || str2 == null) {
        return null;
    }

    const str1Content = readDynamicString(str1);
    const str2Content = readDynamicString(str2);

    return makeDynamicString([...str1Content, ...str2Content]);
}
