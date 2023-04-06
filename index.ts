import './rrweb.min.js'

// @ts-ignore
console.log('rrweb', rrweb)

let events: any = [];

// @ts-ignore
const stop = rrweb.record({
  emit(event: any) {
    // push event into the events array
      events.push(event);
  },
});

setInterval(() => {
  console.log({events});
}, 1000)

export const add = (a: number, b: number) => {
  return a + b
}