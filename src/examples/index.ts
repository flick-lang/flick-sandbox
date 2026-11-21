import fibonacci from "./fibonacci.fl?raw";
import guessingGame from "./guessing-game.fl?raw";
import helloWorld from "./hello-world.fl?raw";
import wrappingCounter from "./wrapping-counter.fl?raw";

export const examples = [
  {
    name: "Fibonacci",
    description: "Recursion, loops and printing numbers",
    code: fibonacci,
  },
  {
    name: "Hello World",
    description: "Print text one character at a time",
    code: helloWorld,
  },
  {
    name: "Guessing game",
    description: "Reads your answers from the terminal",
    code: guessingGame,
  },
  {
    name: "Wrapping counter",
    description: "A 3-bit integer that wraps from 7 to 0",
    code: wrappingCounter,
  },
];
