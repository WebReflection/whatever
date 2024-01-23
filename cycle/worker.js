import { message, addGCPressure, setOnGC } from './registry.js';

// when worker object is gone, tell the main it's gone too
setOnGC(({ id }) => { self.postMessage(['free', id]) });

self.addEventListener('message', message);

// ask to create a reference for ID 0 and 1 in main
self.postMessage(['get', 0]);
self.postMessage(['get', 1]);

setTimeout(addGCPressure, 1000);
