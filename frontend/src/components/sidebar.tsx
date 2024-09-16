export default function Sidebar() {
  return (
    <div className="flex gap-6 flex-col min-h-full p-6 bg-gray-50">
      <h1 className="font-bold text-2xl">The Flick Sandbox</h1>

      <section>
        <h2 className="font-semibold text-xl mb-2">Getting Started</h2>
        <ol className="list-decimal list-inside text-sm space-y-2">
          <li>Choose an example from the dropdown menu.</li>
          <li>Click &quot;Run&quot; to execute your program.</li>
          <li>View the output in the console below the code editor.</li>
        </ol>
      </section>
      
      <section>
        <h2 className="font-semibold text-xl mb-2">About Flick</h2>
        <p className="text-sm mb-2">
          We created the Flick programming language to explore compiler design. Learn more <a
           className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
            href="https://github.com/flick-lang/flick">here</a>.
        </p>
      </section>
      
      <section>
        <h2 className="font-semibold text-xl mb-2">Key Language Features</h2>
        <ul className="list-disc list-inside text-sm space-y-2">
          <li>Static typing with type inference</li>
          <li>Functions and external function declarations</li>
          <li>Simple control flow (if/else, while loops)</li>
          <li>Variable-sized integers (u8, i11, etc.)</li>
        </ul>
      </section>
      
      <section>
        <h2 className="font-semibold text-xl mb-2">Authors</h2>
        <p className="text-sm mb-2">
          This project was created by Max Larsson and Thomas Breydo.
        </p>
      </section>
    </div>
  )
}