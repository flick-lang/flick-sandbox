function App() {
  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Submitted!")
    
  }

  return (
    <div className="App">
      <form onSubmit={(e) => handleSubmit(e)}>
        <textarea id="flick-source" name="flick-source" placeholder="fn main() i32 {" rows="5"></textarea>
        <input type="submit"></input>
      </form>
      <p id="flick-output">This is the text output</p>
    </div>
  );
}

export default App;
