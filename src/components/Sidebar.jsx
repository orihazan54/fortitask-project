import React from "react";
import { Link } from "react-router-dom";
import styles from "./Sidebar.module.css";

const Sidebar = ({ role }) => {
  const menuItems =
    role === "Student"
      ? [
          { label: "Available Courses", path: "/student/courses", icon: "📚" },
          { label: "My Courses", path: "/student/my-courses", icon: "📘" },
        ]
      : [
          { label: "View Students", path: "/teacher/view-students", icon: "👩‍🎓" },
          { label: "Manage Courses", path: "/teacher/manage-courses", icon: "📘" },
          { label: "Create Course", path: "/teacher/create-course", icon: "✏️" },
        ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        {role === "Student" ? "🎓 Student Panel" : "👨‍🏫 Teacher Panel"}
      </div>
      <ul className={styles.list}>
        {menuItems.map((item, index) => (
          <li key={index} className={styles.listItem}>
            <Link to={item.path} className={styles.link}>
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className={styles.footer}>© 2025 Fortitask</div>
    </aside>
  );
};

export default Sidebar;
