import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <Router>
      <ToastContainer
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false}   
        newestOnTop={false} 
        closeOnClick  
        rtl={false}  
        pauseOnFocusLoss
        draggable 
        pauseOnHover
        theme="colored" 
      />
      <App />
    </Router>
  </React.StrictMode>
);