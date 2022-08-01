import { char, print, sizeOfChar, str } from './char';
import { debugFreeHeap, debugHeap, free, malloc, read, write } from './memory';
import { defineStruct } from './struct';

function getHello() {
    const s1 = str('Hello ');

    const hellowBuffer = malloc(6);

    if (hellowBuffer == null) {
        throw 'Not-enough memory';
    }

    write(hellowBuffer, s1);

    return hellowBuffer.headAddress;
}

const personStruct = defineStruct({
    firstName: sizeOfChar() * 4,
    lastName: sizeOfChar() * 7,
});

function getMe() {
    const personBuffer = malloc(personStruct.size);

    if (personBuffer == null) {
        throw 'Not-enough memory';
    }

    write(personBuffer, [...str('Alex'), ...str('Savelev')]);

    return personBuffer.headAddress;
}

function getPersonFullName(person: number) {
    const firstName = read(
        person + personStruct.firstName.align,
        personStruct.firstName.size
    );
    const lastName = read(
        person + personStruct.lastName.align,
        personStruct.lastName.size
    );

    const fullName = [...firstName, char(' '), ...lastName];

    const fullNameBuffer = malloc(fullName.length);

    if (fullNameBuffer == null) {
        throw 'Not-enough memory';
    }

    write(fullNameBuffer, fullName);

    return fullNameBuffer.headAddress;
}

function concatenate(
    str1: number,
    str1Size: number,
    str2: number,
    str2Size: number
) {
    const s1 = read(str1, str1Size);
    const s2 = read(str2, str2Size);

    const concatStr = [...s1, ...s2];

    const concatStrBuffer = malloc(concatStr.length);

    if (concatStrBuffer == null) {
        throw 'Not-enough memory';
    }

    write(concatStrBuffer, concatStr);

    return concatStrBuffer.headAddress;
}

function main() {
    const hello = getHello();

    const me = getMe();

    const myFullName = getPersonFullName(me);

    // free(me, personStruct.size);

    const helloMe = concatenate(
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

debugHeap(0, 100);
