import { print } from './char';
import { int_t, Pointer, pointer_t, Runtime } from './memory';
import { defineStruct } from './struct';
// import { call, ref, refGet } from './ref_counting';
// import {
//     dynamicStrcat,
//     dynamicString_t,
//     dynamicString,
//     readDynamicStringBytes,
// } from './string';
// import { defineStruct } from './struct';

const r = new Runtime();

// const personStruct = defineStruct({
//     firstName: dynamicString_t(),
//     lastName: dynamicString_t(),
// });

// function getMe() {
//     return r.static(
//         personStruct.create({
//             firstName: dynamicString(r, 'Alex'),
//             lastName: dynamicString(r, 'Savelev'),
//         })
//     );
// }

// function getDoe() {
//     return r.static(
//         personStruct.create({
//             firstName: dynamicString(r, 'Jane'),
//             lastName: dynamicString(r, 'Doe'),
//         })
//     );
// }

// function getPersonFullName(person: Pointer) {
//     const firstName = personStruct.get(r, person, 'firstName');
//     const lastName = personStruct.get(r, person, 'lastName');
//     const space = dynamicString(r, ' ');

//     const t1 = r.call(dynamicStrcat, r, firstName, space);
//     const fullName = r.call(dynamicStrcat, r, t1, lastName);

//     return fullName;
// }

// r.call(function main() {
//     const helloSuffix = dynamicString(r, 'Hello ');

//     const me = r.call(getMe);
//     const anonym = r.call(getDoe);

//     const myFullName = r.call(getPersonFullName, me);
//     const anonymFullName = r.call(getPersonFullName, anonym);

//     const and = dynamicString(r, ' and ');

//     const helloMe = r.call(dynamicStrcat, r, helloSuffix, myFullName);
//     const andAnonim = r.call(dynamicStrcat, r, and, anonymFullName);

//     const greeting = r.call(dynamicStrcat, r, helloMe, andAnonim);

//     r.debugStack(0, 50);
//     r.debugHeap(0, 200);

//     print(readDynamicStringBytes(r, greeting));
// });

const foo = defineStruct({
    bar: int_t,
    baz: int_t,
});

const bar = defineStruct({
    asd: pointer_t(foo),
});

function getBar() {
    const _foo = r.new(foo, {
        bar: 2,
        baz: 3,
    });
    const _bar = r.static(bar, {
        asd: _foo.deref(),
    });

    return _bar;
}

function getFoo() {
    const foo1 = r.static(int_t, 10);
    return foo1;
}

r.call(function main() {
    const foo1 = r.call(getFoo);

    // const foo2 = r.static(foo, {
    //     bar: 2,
    //     baz: 3,
    // });
    // const foo3 = r.new(foo, {
    //     bar: 4,
    //     baz: 5,
    // });

    const _bar = r.call(getBar);

    r.debugStack(0, 50);
    r.debugHeap(0, 200);

    console.log(foo1.get(r));

    // const sum = foo.get(r, foo2.get(), 'bar') + foo.get(r, foo2.get(), 'baz');
    // console.log(sum);

    // const sum2 = foo.get(r, foo3.get(), 'bar') + foo.get(r, foo3.get(), 'baz');
    // console.log(sum2);

    const _foo = bar.get(r, _bar.deref(), 'asd');

    console.log(foo.fromBytes(r.read(_foo)));

    const sum = foo.get(r, _foo, 'bar') + foo.get(r, _foo, 'baz');
    console.log(sum);

    r.free(_foo);
});

r.debugStack(0, 50);
r.debugHeap(0, 200);
