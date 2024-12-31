import React from "react";
import { Link } from "react-router-dom";
import styles from "./Sidebar.module.css";

const Sidebar = ({ role }) => {
  const menuItems = role === "Student" 
    ? [
        { label: "View Assignments", path: "/student/view-assignments" },
        { label: "Submit Assignment", path: "/student/submit-assignment" },
        { label: "My Courses", path: "/student/courses" },
      ]
    : [
        { label: "View Students", path: "/teacher/view-students" },
        { label: "Create Assignment", path: "/teacher/create-assignment" },
        { label: "My Courses", path: "/teacher/courses" },
      ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>{role === "Student" ? "Student Panel" : "Teacher Panel"}</div>
      <ul className={styles.list}>
        {menuItems.map((item, index) => (
          <li key={index} className={styles.listItem}>
            <Link to={item.path} className={styles.link}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
