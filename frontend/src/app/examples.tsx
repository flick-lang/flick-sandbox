interface Example {
    title: string;
    code: string;
}

const examples: Example[] = [
    {
        title: "Hello, World!",
        code: `// Basic program that prints "Hello, World!"
//
// Try running it by pressing Run in the top right

pub fn main() {
    println("Hello, World!");
}`
    },
    {
        title: "Fibonacci",
        code: `pub fn fibonacci(n: i32) -> i32 {
    if n <= 1 {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}`
    }
]

export default examples