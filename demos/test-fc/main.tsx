import React from "react";
import ReactDOM from "react-dom";

function App() {
  return (
    <div>
      <Child />
    </div>
  );
}

function Child() {
  return <div>Child</div>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
