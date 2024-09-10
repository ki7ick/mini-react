import { useState } from "react";
import ReactDOM from "react-dom";

function App() {
  const [num, setNum] = useState(100);
  window.setNum = setNum;
  return <div>{num}</div>;
}

function Child() {
  return <div>Child</div>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
