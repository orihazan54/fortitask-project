
import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { Book, BookOpen, Users, PenTool, GraduationCap, FileText, Home } from "lucide-react";

const Sidebar = ({ role }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const menuItems =
    role === "Student"
      ? [
          { label: "Dashboard", path: "/student-dashboard", icon: <Home size={18} /> },
          { label: "Available Courses", path: "/student/courses", icon: <Book size={18} /> },
          { label: "My Courses", path: "/student/my-courses", icon: <BookOpen size={18} /> },
          { label: "My Profile", path: "/student/profile", icon: <Users size={18} /> },
        ]
      : [
          { label: "Dashboard", path: "/teacher-dashboard", icon: <Home size={18} /> },
          { label: "View Students", path: "/teacher/view-students", icon: <Users size={18} /> },
          { label: "Manage Courses", path: "/teacher/manage-courses", icon: <Book size={18} /> },
          { label: "Create Course", path: "/teacher/create-course", icon: <PenTool size={18} /> },
          { label: "My Profile", path: "/teacher/profile", icon: <Users size={18} /> },
        ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        {role === "Student" ? (
          <div className={styles.roleTitle}>
            <span className={styles.roleIcon}><GraduationCap size={24} /></span>
            <span>Student Portal</span>
          </div>
        ) : (
          <div className={styles.roleTitle}>
            <span className={styles.roleIcon}><FileText size={24} /></span>
            <span>Teacher Portal</span>
          </div>
        )}
      </div>
      <nav>
        <ul className={styles.list}>
          {menuItems.map((item, index) => (
            <li 
              key={index} 
              className={`${styles.listItem} ${currentPath === item.path ? styles.active : ""}`}
            >
              <Link to={item.path} className={styles.link}>
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.footer}>© 2025 Fortitask</div>
    </aside>
  );
};

export default Sidebar;