
import React from "react";

export const Card = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`rounded-lg border border-white/10 bg-[rgba(30,41,59,0.7)] backdrop-blur-md text-white shadow-lg ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`flex flex-col space-y-1.5 p-6 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = "", ...props }) => {
  return (
    <h3 
      className={`text-2xl font-semibold leading-none tracking-tight text-white ${className}`} 
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = "", ...props }) => {
  return (
    <p 
      className={`text-sm text-white/80 ${className}`} 
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`p-6 pt-0 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`flex items-center p-6 pt-0 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};