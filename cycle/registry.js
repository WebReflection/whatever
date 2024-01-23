import { create } from 'https://cdn.jsdelivr.net/npm/gc-hook/es.js';

const world = self.document ? 'main' : 'worker';

let onGC;

export const setOnGC = value => { onGC = value };

export const held = new Map;

// when a message is received a reference object for that id
// is created and added to the registry.
// however it's retained value on this world will be freed
// in a second and the other world can also drop it
export const message = ({ data: [action, id] }) => {
    switch (action) {
        case 'get':
            if (!held.has(id)) {
                console.log(`creating ${id} on ${world}`);

                const ref = { id };
                // trap local reference
                held.set(id, ref);

                // proxy the reference (that's what's used in this world)
                // the original `ref` can be a PyProxy or a pointer.
                let proxy = create(ref, onGC);

                // how to attach a cycle to `proxy` before this happens?
                setTimeout(() => {
                    proxy = null;
                    console.log(`${id} in ${world} can be collected`);
                }, 1000);
            }
            break;
        case 'free':
            console.log(`freeing ${id} on ${world}`);
            held.delete(id);
            break;
    }
};

export const addGCPressure = (pressure = [], match = Math.random()) => {
    if (!held.size)
        pressure.splice(0);

    for (let i = 0; i < 0xFFF; i++)
        pressure.push({ value: Math.random() });

    if (pressure.some(({ value }) => value === match))
        console.log(`MATCH FOUND IN ${world}`);
    
    setTimeout(addGCPressure, 0, pressure, match);
};
