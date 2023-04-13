console.log('react-scanner-client');
import * as rrweb from 'rrweb';
import CircularJSON from 'circular-json';
import { uploadFile } from './uploadClass';

// @ts-ignore
window.getReactDomComponent = function (dom: any) {
  console.log('getReactDomComponent', dom);
  
  // @ts-ignore
  const internalInstance =
  // @ts-ignore
  dom[Object.keys(dom ?? {}).find((key) => key.startsWith('__react'))];
  if (!internalInstance) return null;
  return {
    internalInstance,
    props: internalInstance.memoizedProps,
    state: internalInstance.memoizedState,
  };
};


const uploadIntervalMs = 5000; // Upload every 5 seconds
// const workerEndpoint = "http://0.0.0.0:8787";
const workerEndpoint = "https://upload-worker.react-scanner.workers.dev";

async function initReactScannerClient({orgToken}: {orgToken: string}) {
  const events: unknown[] = [];
  
  // Start recording events with rrweb
  const stop = rrweb.record({
    sampling: {
    // do not record mouse movement
    mousemove: false,
    // do not record mouse interaction
    // mouseInteraction: false,
    // set the interval of scrolling event
    scroll: 150, // do not emit twice in 150ms
    // set the interval of media interaction event
    media: 800,
    // set the timing of record input
    input: 'last', // When input mulitple characters, only record the final input
  },
    emit(event) {
      events.push(event);
    },
  });
  
  const recordKey = `${crypto.randomUUID()}.json`;
  setInterval(async () => {

    let blob = new Blob([CircularJSON.stringify(events)], { type: "application/json" });
    await uploadFile(blob, {recordKey, orgToken, workerEndpoint});
      
  }, uploadIntervalMs)

  // Stop recording events when the function is unloaded
  return function () {
    stop?.();
  };
};

export default initReactScannerClient;