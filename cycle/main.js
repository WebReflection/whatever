import { held, message, addGCPressure, setOnGC } from './registry.js';

// when main object is gone, tell the worker it's gone too
setOnGC(({ id }) => { worker.postMessage(['free', id]) });

const worker = new Worker('worker.js', { type: 'module' });

worker.addEventListener('message', message);

// ask to create a reference for ID 0 and 1 in worker
worker.postMessage(['get', 0]);
worker.postMessage(['get', 1]);

setTimeout(addGCPressure, 1000);

globalThis.held = held;
