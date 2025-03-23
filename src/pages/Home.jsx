
import React from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import "../styles/Home.css";
import { FaTasks, FaUserShield, FaChartBar, FaGraduationCap, FaArrowRight, FaChalkboardTeacher, FaLaptopCode, FaBrain } from "react-icons/fa";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="home-container">
        <header className="hero-section">
          <div className="hero-content">
            <h1>Fortitask</h1>
            <h2>Educational Task Management Platform</h2>
            <p>Manage tasks, track student progress, and enhance academic collaboration all in one place</p>
            
            <div className="home-buttons">
              <Link to="/login" className="btn btn-primary">
                <span>Login</span>
                <FaArrowRight className="btn-icon" />
              </Link>
              <Link to="/signup" className="btn btn-secondary">
                <span>Register</span>
                <FaArrowRight className="btn-icon" />
              </Link>
            </div>
          </div>
        </header>

        <section className="features-section">
          <div className="info-cards">
            <div className="card">
              <FaTasks className="card-icon" />
              <h3 className="card-title">Advanced Task Management</h3>
              <p className="card-description">
                A system that allows teachers to efficiently manage and track student assignments
              </p>
            </div>
            <div className="card">
              <FaUserShield className="card-icon" />
              <h3 className="card-title">Secure Platform</h3>
              <p className="card-description">
                Advanced security ensuring protection of personal information and student submissions
              </p>
            </div>
            <div className="card">
              <FaChartBar className="card-icon" />
              <h3 className="card-title">Analytics & Statistics</h3>
              <p className="card-description">
                Analytical tools providing insights on student performance and helping improve teaching
              </p>
            </div>
          </div>
        </section>
        
        <section className="roles-section">
          <div className="roles-content">
            <div className="role-info">
              <h2>A System Built Specifically for Educational Environments</h2>
              <p>
                Fortitask bridges the gap between educational needs and technological solutions. 
                Whether you're a teacher managing learning materials or a student tracking assignments, 
                the system is tailored to your needs.
              </p>
              
              <div className="role-cards">
                <div className="role-card">
                  <div className="role-icon-wrapper">
                    <FaGraduationCap className="role-icon" />
                  </div>
                  <div>
                    <h3>For Students</h3>
                    <p>Simple tracking of assignments, management of submission deadlines, and easy submission of work - everything needed for academic success.</p>
                  </div>
                </div>
                
                <div className="role-card">
                  <div className="role-icon-wrapper">
                    <FaChalkboardTeacher className="role-icon" />
                  </div>
                  <div>
                    <h3>For Teachers</h3>
                    <p>Creation and management of courses, tracking student performance, and evaluating work - all in a convenient and direct interface.</p>
                  </div>
                </div>
              </div>
              
              <div className="cta-button">
                <Link to="/signup" className="btn btn-join">
                  <span>Join Now</span>
                  <FaArrowRight className="btn-icon" />
                </Link>
              </div>
            </div>
            
            <div className="features-cards">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <FaChalkboardTeacher className="feature-icon" />
                </div>
                <h3>Teacher Interface</h3>
                <p>Dedicated tools for managing classes and courses</p>
                <ul className="feature-list">
                  <li>Easily create and edit courses and assignments</li>
                  <li>Quick evaluation of student work with feedback</li>
                  <li>Detailed statistics on class performance</li>
                  <li>Manage student lists and track progress</li>
                </ul>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <FaLaptopCode className="feature-icon" />
                </div>
                <h3>Technology Tools</h3>
                <p>Advanced digital solutions</p>
                <ul className="feature-list">
                  <li>Secure file uploads with automatic backup</li>
                  <li>Real-time notifications for submission deadlines</li>
                  <li>Access from any device, anytime</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img 
              src={require("../assets/logo.png")} 
              alt="Fortitask Logo" 
              className="footer-logo-img"
            />
            <span className="footer-logo-text">Fortitask</span>
          </div>
          <p className="footer-copyright">© 2023 Fortitask. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;