import React, { useState, useEffect } from 'react'

function App() {
  const [socket, setSocket] = useState(null)
  const [source, setSource] = useState("")
  const [output, setOutput] = useState("")
  
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/compiler")
    setSocket(ws)

    ws.onmessage = (event) => {
      setOutput((prevOutput) => prevOutput + event.data)
    }

    return () => {
      ws.close()
    }
  }, [])


  const compileCode = (e) => {
    if (socket.readyState !== WebSocket.OPEN) {
      setOutput("Failed to connect to compiler")
      return
    }

    setOutput("Compiling...\n")
    socket.send(source)
  }

  return (
    <div className="App">
      <textarea onChange={(e) => setSource(e.target.value)}></textarea>
      <button onClick={compileCode}>Compile</button>
      <p>{output}</p>
    </div>
  );
}

export default App;
