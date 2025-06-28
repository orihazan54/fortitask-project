import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import App from "./App";

// Application entry point with React 18's concurrent features
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render main application with strict mode for development warnings
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);