
import React from "react";

export const Button = ({ 
  children, 
  className = "", 
  variant = "default", 
  size = "default",
  ...props 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "default":
        return "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white hover:from-indigo-600 hover:to-indigo-800";
      case "destructive":
        return "bg-gradient-to-br from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800";
      case "outline":
        return "border border-white/20 bg-transparent text-white hover:bg-white/10";
      case "secondary":
        return "bg-white/10 text-white hover:bg-white/20";
      case "ghost":
        return "hover:bg-white/10 text-white";
      case "link":
        return "text-indigo-400 underline-offset-4 hover:underline";
      default:
        return "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white hover:from-indigo-600 hover:to-indigo-800";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "default":
        return "h-10 px-4 py-2";
      case "sm":
        return "h-9 rounded-md px-3";
      case "lg":
        return "h-11 rounded-md px-8";
      case "icon":
        return "h-10 w-10";
      default:
        return "h-10 px-4 py-2";
    }
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};