import React from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import "../styles/Home.css";
import { 
  ListChecks, 
  ShieldCheck, 
  BarChart3, 
  GraduationCap, 
  ArrowRight, 
  BookOpenText, 
  Laptop, 
  Brain 
} from 'lucide-react';
import logo from "../assets/logo.png";

// Professional landing page showcasing platform features and capabilities
const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient">
      <NavBar />
      <main className="flex-1">
        {/* Hero section with compelling value proposition and call-to-action */}
        <header className="hero-section">
          <div className="hero-content animate-fade-in">
            <div className="hero-shine"></div>
            <h1 className="hero-title">Fortitask</h1>
            <h2 className="hero-subtitle">Educational Task Management Platform</h2>
            <p className="hero-description">
              Streamline your academic workflow with our comprehensive task management system. 
              Perfect for both educators and students.
            </p>
            
            {/* Primary action buttons for user onboarding */}
            <div className="home-buttons">
              <Link to="/login" className="btn btn-primary">
                <span>Get Started</span>
                <ArrowRight className="btn-icon" />
              </Link>
              <Link to="/signup" className="btn btn-secondary">
                <span>Create Account</span>
                <ArrowRight className="btn-icon" />
              </Link>
            </div>
          </div>
        </header>

        {/* Core platform features showcase with visual icons */}
        <section className="features-section animate-fade-in">
          <div className="section-header">
            <h2 className="section-title">Platform Features</h2>
            <div className="title-underline"></div>
          </div>
          
          {/* Feature cards highlighting key platform capabilities */}
          <div className="info-cards">
            <div className="card glass-effect">
              <ListChecks className="card-icon" />
              <h3 className="card-title">Smart Task Management</h3>
              <p className="card-description">
                Efficiently organize and track assignments with our intuitive task management system
              </p>
            </div>
            
            <div className="card glass-effect">
              <ShieldCheck className="card-icon" />
              <h3 className="card-title">Enhanced Security</h3>
              <p className="card-description">
                State-of-the-art security measures protecting your academic data and personal information
              </p>
            </div>
            
            <div className="card glass-effect">
              <BarChart3 className="card-icon" />
              <h3 className="card-title">Advanced Analytics</h3>
              <p className="card-description">
                Comprehensive insights into student performance and learning progress
              </p>
            </div>
          </div>
        </section>
        
        {/* Role-specific features section for students and teachers */}
        <section className="roles-section">
          <div className="section-header">
            <h2 className="section-title">Designed For Everyone</h2>
            <div className="title-underline"></div>
          </div>
          
          <div className="roles-content">
            <div className="role-info animate-fade-in">
              <p className="roles-description">
                Experience a platform specifically designed for modern educational needs. 
                Whether you're teaching or learning, Fortitask adapts to your workflow.
              </p>
              
              {/* User type cards with specific feature highlights */}
              <div className="role-cards">
                <div className="role-card glass-effect">
                  <div className="role-icon-wrapper">
                    <GraduationCap className="role-icon" />
                  </div>
                  <div className="role-content">
                    <h3>Student Experience</h3>
                    <p>Track assignments, manage deadlines, and submit work seamlessly - everything you need for academic excellence.</p>
                  </div>
                </div>
                
                <div className="role-card glass-effect">
                  <div className="role-icon-wrapper">
                    <BookOpenText className="role-icon" />
                  </div>
                  <div className="role-content">
                    <h3>Teacher Dashboard</h3>
                    <p>Comprehensive tools for course management, student evaluation, and performance tracking in one intuitive interface.</p>
                  </div>
                </div>
              </div>
              
              {/* Secondary call-to-action for registration */}
              <div className="cta-button">
                <Link to="/signup" className="btn btn-join glass-effect">
                  <span>Start Your Journey</span>
                  <ArrowRight className="btn-icon" />
                </Link>
              </div>
            </div>
            
            {/* Detailed feature breakdown with benefits listing */}
            <div className="features-cards">
              <div className="feature-card glass-effect">
                <div className="feature-icon-wrapper">
                  <BookOpenText className="feature-icon" />
                </div>
                <h3>Powerful Teaching Tools</h3>
                <p>Complete suite for educational management</p>
                <ul className="feature-list">
                  <li>Intuitive course creation and management</li>
                  <li>Streamlined assignment evaluation</li>
                  <li>Real-time performance analytics</li>
                  <li>Automated progress tracking</li>
                </ul>
              </div>
              
              <div className="feature-card glass-effect">
                <div className="feature-icon-wrapper">
                  <Laptop className="feature-icon" />
                </div>
                <h3>Modern Technology</h3>
                <p>Built for today's digital education</p>
                <ul className="feature-list">
                  <li>Cloud-based file management</li>
                  <li>Smart notification system</li>
                  <li>Cross-device accessibility</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Professional footer with branding and copyright */}
      <footer className="footer glass-effect">
        <div className="footer-content">
          <div className="footer-logo">
            <img 
              src={logo} 
              alt="Fortitask Logo" 
              className="footer-logo-img"
            />
            <span className="footer-logo-text">Fortitask</span>
          </div>
          <p className="footer-copyright">© 2024 Fortitask. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;