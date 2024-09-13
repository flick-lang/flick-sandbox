interface Example {
    title: string
    code: string
}

const examples: Example[] = [
    {
        title: "Fibonacci",
        code: `// Simple recursive program that prints Fibonacci numbers
//
// Try running it by pressing Run in the top right

extern fn putchar(u8 c) u8

fn fib(u64 n) u64 {
    if n == 0 {
        ret 0
    } else if n == 1 {
        ret 1
    }
    
    ret fib(n-1) + fib(n-2)
}

fn printnum(u64 n) {
    u64 reversed = 0
    while n > 0 {
        reversed *= 10
        reversed += n % 10
        n /= 10
    }
    while reversed > 0 {
        u8 digit = (u8) (reversed % 10)
        u8 _ = putchar(48 + digit)
        reversed /= 10
    }
}

pub fn main() u8 {
    u64 n = 0
    while n < 8 {
        printnum(fib(n))
        putchar(32) // space
        n += 1
    }
    ret 0
}`
    },
    {
        title: "Hello World",
        code: `// Basic program that prints "Hello World"
//
// Try running it by pressing Run in the top right

extern fn putchar(i8 c) i8

pub fn main() u8 {
    i8 a = putchar(72)
    i8 a = putchar(101)
    i8 a = putchar(108)
    i8 a = putchar(108)
    i8 a = putchar(111)
    i8 a = putchar(32)
    i8 a = putchar(87)
    i8 a = putchar(111)
    i8 a = putchar(114)
    i8 a = putchar(108)
    i8 a = putchar(100)
    i8 a = putchar(10)
    ret 0
}`
    }
]

export default examples