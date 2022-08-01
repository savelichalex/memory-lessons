import { str } from './char';
import { DynamicPointer, pointer_t, Runtime } from './memory';
import { defineStruct } from './struct';

function int_t() {
    return {
        toBytes: (val: number) => [val],
        fromBytes: (bytes: number[]) => bytes[0],
        size: 1,
    };
}

const dynamicStringListNode = defineStruct({
    value: int_t(),
    next: pointer_t(),
});

function makeDynamicString(r: Runtime, content: number[]): DynamicPointer {
    // TODO: str.length === 0

    const head = r.new(
        dynamicStringListNode.create({
            value: content[0],
            next: DynamicPointer.of(0, 0),
        })
    );

    let currentNode = head;

    for (let i = 1; i < content.length; i += 1) {
        const nextSymbolNode = r.new(
            dynamicStringListNode.create({
                value: content[i],
                next: DynamicPointer.of(0, 0),
            })
        );

        dynamicStringListNode.set(r, currentNode, 'next', nextSymbolNode);

        currentNode = nextSymbolNode;
    }

    return head;
}

export function dynamicString(r: Runtime, s: string): DynamicPointer {
    return makeDynamicString(r, str(s));
}

export function dynamicString_t() {
    return pointer_t();
}

export function readDynamicStringBytes(r: Runtime, ptr: DynamicPointer) {
    const result: number[] = [];

    let next = ptr;

    while (next.head != 0) {
        const nodeValue = dynamicStringListNode.get(r, next, 'value');
        const nextNode = dynamicStringListNode.get(r, next, 'next');

        result.push(nodeValue);

        next = nextNode;
    }

    return result;
}

export function dynamicStrcat(
    r: Runtime,
    str1: DynamicPointer,
    str2: DynamicPointer
) {
    const str1Content = readDynamicStringBytes(r, str1);
    const str2Content = readDynamicStringBytes(r, str2);

    return makeDynamicString(r, [...str1Content, ...str2Content]);
}
