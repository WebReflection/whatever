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

                // ... I am going to try the cycle on DOM here ...
                if (world === 'main') {
                    let live = document.querySelector('div');
                    if (!live.ref) {
                        // this won't cause any issue
                        live.ref = proxy;

                        // this would cause a cycle ... BUT ...
                        // the proxy here is not what real proxies do
                        // real proxies would instead create the cross reference
                        // for just an identifier in the other world (worker)
                        // so this breaks this demo but I am not sure it would break
                        // the real-world use case because when live is collected
                        // this reference *should* be freed or non existent!
                        // proxy.live = live;

                        // in order to better simulate what happens for real
                        // let's try this instead
                        proxy.live = new WeakRef(live);
                        // so now it frees (after a while) without issues

                        // simulating DOM trashing in 2 seconds
                        setTimeout(() => live.remove(), 2000);
                    }
                }

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
