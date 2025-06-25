import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/BackButton.css";

const BackButton = ({ to = "/teacher-dashboard", label = "Back", className = "" }) => {
  const navigate = useNavigate();
  return (
    <button
      className={`back-button ${className}`.trim()}
      onClick={() => navigate(to)}
    >
      <ArrowLeft size={18} />
      {label}
    </button>
  );
};

export default BackButton; 