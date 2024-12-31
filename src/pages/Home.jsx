import React from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import "../styles/Home.css";
import { FaTasks, FaUserShield, FaRocket } from "react-icons/fa"; // אייקונים

const Home = () => {
  return (
    <>
      <NavBar />
      <div className="home-container">
        <div className="home-content animate__animated animate__fadeIn">
          <h1>Welcome to Fortitask</h1>
          <p>Manage your assignments and tasks efficiently with our platform.</p>
          <div className="home-buttons">
            <Link to="/login" className="btn">Login</Link>
            <Link to="/signup" className="btn">Sign Up</Link>
          </div>
        </div>

        {/* כרטיסי מידע */}
        <div className="info-cards">
          <div className="card">
            <FaTasks className="card-icon" />
            <h3 className="card-title">Organized Tasks</h3>
            <p className="card-description">
              Stay on top of your assignments with an intuitive task manager.
            </p>
          </div>
          <div className="card">
            <FaUserShield className="card-icon" />
            <h3 className="card-title">Secure Platform</h3>
            <p className="card-description">
              Your data is protected with state-of-the-art security measures.
            </p>
          </div>
          <div className="card">
            <FaRocket className="card-icon" />
            <h3 className="card-title">Boost Productivity</h3>
            <p className="card-description">
              Achieve more with tools designed for efficiency.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
