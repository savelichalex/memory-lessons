import { malloc, read, write } from './memory';

const map =
    'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM123456789 '.split('');

export function char(char: string) {
    return map.findIndex((it) => it === char);
}

export function char_t() {
    return {
        make: (val: string) => [char(val)],
        size: sizeOfChar(),
    };
}

export function sizeOfChar() {
    return 1;
}

export function str(s: string) {
    return s.split('').map(char);
}

export function str_t(size: number) {
    return {
        make: str,
        size: sizeOfChar() * size,
    };
}

export function print(contents: number[] | null) {
    if (contents == null) {
        return null;
    }
    const s = contents.reduce((acc, it) => {
        acc += map[it];
        return acc;
    }, '');
    console.log(s);
}

export function strcat(
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

export function debugChar(it: number) {
    return map[it];
}
