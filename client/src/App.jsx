import { useState } from "react";
import "./App.css";

function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState(null);
  const [userprompt,setUserprompt] = useState("")
  console.log(results);
  const input_file = (event) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
    setResults(null);
  };
  const input_prompt = (event) => {
    event.target.value == "Enter Prompt/Questions"? setUserprompt("") :
    setUserprompt(event.target.value);
  }
  const start_process = async () => {
    if (files.length === 0) return alert("Please upload a file first.");
    const formdata = new FormData();
    for (let i = 0; i < files.length; i++) {
      formdata.append("files", files[i]);
    }
    formdata.append("userprompt", userprompt);
    
    try{
      setResults("Processing...");
      const response = await fetch("http://localhost:5000/analyze",{method:"POST", body: formdata});
      if(!response.ok){
        throw new Error(`HTTP error! status: ${response.status}`);
      }else{
        const data = await response.json();
        console.log(data);
        setResults(data);

      }
    }catch(error){
      console.error("Error uploading:", error);
      setResults("Error: Failed to connect to backend.");
  }}
  return (
    <div>
      <h1>AI Research Assistant</h1>

      {/* --- Section 1: Upload --- */}
      <section>
        <h3>Upload Documents</h3>
        <input type="file" multiple onChange={input_file} />
        <div style={{marginTop: '10px'}}>
            {files.length > 0 ? (
                <ul>
                    {files.map((f, index) => <li key={index}>{f.name}</li>)}
                </ul>
            ) : "No files selected"}
        </div>
      </section>

      <hr />

      {/* --- Section 2: Customization --- */}
      <section>
        <h3>2. Customization</h3>
        <label>
          <input type="checkbox" />
          Enable Real-time Web Search
        </label>
        <br />
        <label >Enter Prompt</label>
        <input type="text" onChange={input_prompt} defaultValue={"Enter Prompt/Questions"}/>

        <br />
        <br />
        <button onClick={start_process}>Analyze & Generate</button>
      </section>

      <hr />

      {/* --- Section 3: AI Results --- */}
      <section>
        <h3>3. AI Results</h3>
        <p>
          <em>AI answers and source links will appear here.</em>
        </p>
      </section>
    </div>
  );
}
export default App;
