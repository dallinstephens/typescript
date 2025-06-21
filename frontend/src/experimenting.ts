const world = 'world';

export function hello(who: string = world): string {
  return `Hello ${who}! `;
}

const defaultGreeting = hello();
console.log(defaultGreeting);

const greetDallin = hello('Dallin');
console.log(greetDallin);