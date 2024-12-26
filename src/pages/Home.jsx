import React from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="animate__animated animate__fadeInDown">Welcome to Fortitask</h1>
        <p className="animate__animated animate__fadeInUp">
          Manage your assignments and tasks efficiently with our innovative platform.
        </p>
        <div className="home-buttons animate__animated animate__fadeInUp">
          <Link to="/login" className="btn login-btn">Login</Link>
          <Link to="/signup" className="btn signup-btn">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
