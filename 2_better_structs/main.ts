import { char, print, sizeOfChar, str, strcat, str_t } from './char';
import { debugFreeHeap, debugHeap, free, malloc, read, write } from './memory';
import { allocStruct, createStruct, defineStruct, structGet } from './struct';

function getHello() {
    const sBytes = str('Hello ');

    const hellowBuffer = malloc(6);

    if (hellowBuffer == null) {
        throw 'Not-enough memory';
    }

    write(hellowBuffer, sBytes);

    return hellowBuffer.headAddress;
}

const personStruct = defineStruct({
    firstName: str_t(4),
    lastName: str_t(7),
});

function getPersonFullName(person: number) {
    const firstName = structGet(personStruct, person, 'firstName');
    const lastName = structGet(personStruct, person, 'lastName');

    const fullName = [...firstName, char(' '), ...lastName];

    const fullNameBuffer = malloc(fullName.length);

    if (fullNameBuffer == null) {
        throw 'Not-enough memory';
    }

    write(fullNameBuffer, fullName);

    return fullNameBuffer.headAddress;
}

function main() {
    const hello = getHello();

    const me = allocStruct(personStruct, {
        firstName: 'Alex',
        lastName: 'Savelev',
    });

    if (me == null) {
        throw 'Not-enough memory';
    }

    const myFullName = getPersonFullName(me);

    // free(me, personStruct.size);

    const helloMe = strcat(
        hello,
        6,
        myFullName,
        personStruct.firstName.size + personStruct.lastName.size + 1
    );

    const s = read(
        helloMe,
        6 + personStruct.firstName.size + personStruct.lastName.size + 1
    );

    print(s);
}

main();

// debugHeap(0, 100);
