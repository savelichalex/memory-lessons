const map =
    'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM123456789 '.split('');

export function char(char: string) {
    return map.findIndex((it) => it === char);
}

export function sizeOfChar() {
    return 1;
}

export function str(s: string) {
    return s.split('').map(char);
}

export function print(contents: number[]) {
    const s = contents.reduce((acc, it) => {
        acc += map[it];
        return acc;
    }, '');
    console.log(s);
}
