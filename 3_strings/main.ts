import { print } from './char';
import { debugFreeHeap, debugHeap } from './memory';
import {
    dynamicStrcat,
    dynamicString,
    dynamicString_t,
    readDynamicString,
} from './string';
import { allocStruct, defineStruct, structGet } from './struct';

function getHello() {
    const helloStr = dynamicString('Hello ');

    if (helloStr == null) {
        throw 'Not-enough memory';
    }

    return helloStr;
}

const personStruct = defineStruct({
    firstName: dynamicString_t(),
    lastName: dynamicString_t(),
});

function getPersonFullName(person: number | null) {
    if (person == null) {
        return null;
    }

    const firstName = structGet(personStruct, person, 'firstName')[0];
    const lastName = structGet(personStruct, person, 'lastName')[0];
    const space = dynamicString(' ');

    if (space == null) {
        return null;
    }

    const t1 = dynamicStrcat(firstName, space);

    if (t1 == null) {
        return null;
    }

    const fullName = dynamicStrcat(t1, lastName);

    if (fullName == null) {
        return null;
    }

    return fullName;
}

function main() {
    const helloSuffix = getHello();

    const me = allocStruct(personStruct, {
        firstName: dynamicString('Alex'),
        lastName: dynamicString('Savelev'),
    });

    const anonym = allocStruct(personStruct, {
        firstName: dynamicString('Jane'),
        lastName: dynamicString('Doe'),
    });

    const myFullName = getPersonFullName(me);
    const anonymFullName = getPersonFullName(anonym);
    const and = dynamicString(' and ');

    // free(me, personStruct.size);

    const helloMe = dynamicStrcat(helloSuffix, myFullName);
    const andAnonim = dynamicStrcat(and, anonymFullName);

    const greeting = dynamicStrcat(helloMe, andAnonim);

    if (greeting == null) {
        throw 'Not-enough memory';
    }

    print(readDynamicString(greeting));
}

main();

debugHeap(0, 200);
