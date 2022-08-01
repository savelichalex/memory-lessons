import { print } from './char';
import { debugFreeHeap, debugHeap } from './memory';
import { call, ref, refGet } from './ref_counting';
import {
    dynamicStrcat,
    dynamicString_t,
    newDynamicString,
    readDynamicString,
} from './string';
import { defineStruct, newStruct, structGet } from './struct';

const personStruct = defineStruct({
    firstName: dynamicString_t(),
    lastName: dynamicString_t(),
});

function getPersonFullName(person: number | null) {
    if (person == null) {
        return null;
    }

    const firstName = structGet(personStruct, refGet(person), 'firstName')[0];
    const lastName = structGet(personStruct, refGet(person), 'lastName')[0];
    const space = ref(newDynamicString, ' ');

    const t1 = call(dynamicStrcat, refGet(firstName), refGet(space));
    const fullName = call(dynamicStrcat, refGet(t1), refGet(lastName));

    return fullName;
}

function getMe() {
    return ref(newStruct, personStruct, {
        firstName: ref(newDynamicString, 'Alex'),
        lastName: ref(newDynamicString, 'Savelev'),
    });
}

function getDoe() {
    return ref(newStruct, personStruct, {
        firstName: ref(newDynamicString, 'Jane'),
        lastName: ref(newDynamicString, 'Doe'),
    });
}

function main() {
    const helloSuffix = ref(newDynamicString, 'Hello ');

    const me = call(getMe);
    const anonym = call(getDoe);

    const myFullName = call(getPersonFullName, me);
    const anonymFullName = call(getPersonFullName, anonym);

    const and = ref(newDynamicString, ' and ');

    const helloMe = call(
        dynamicStrcat,
        refGet(helloSuffix),
        refGet(myFullName)
    );
    const andAnonim = call(dynamicStrcat, refGet(and), refGet(anonymFullName));

    const greeting = call(dynamicStrcat, refGet(helloMe), refGet(andAnonim));

    if (greeting == null) {
        throw 'Not-enough memory';
    }

    print(readDynamicString(refGet(greeting)));
}

call(main);

debugHeap(0, 200);
