import React from "react";
import { Link } from "react-router-dom";
import styles from "./Sidebar.module.css";

const Sidebar = ({ role }) => {
  const menuItems = role === "Student"
    ? [
        { label: "My Courses", path: "/student/courses", icon: "📚" },
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
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
