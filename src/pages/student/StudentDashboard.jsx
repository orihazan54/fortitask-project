
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { getUserDetails, getMyCourses } from "../../services/api";
import { toast } from "react-toastify";
import { 
  BookOpen, CalendarDays, ClipboardList, GraduationCap, 
  LineChart, Clock, CheckCircle, AlertTriangle,
  Bell, Trophy, Laptop, Award, BookMarked,
  ChevronRight, ArrowUpRight, FileCheck, BarChart3
} from "lucide-react";
import "../../styles/StudentDashboard.css";

const StudentDashboard = () => {
  const [studentName, setStudentName] = useState("Student");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    enrolledCourses: 0,
    assignments: 0,
    upcomingDeadlines: [],
    averageGrade: 0,
    recentActivities: [],
    achievements: []
  });
  const navigate = useNavigate();
  const [showToasts, setShowToasts] = useState(false); // Control toast display

  // Fetch student data with improved error handling
  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user details first
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("User authentication information missing");
      }
      
      // Using try/catch for each API call to prevent complete failure
      try {
        const userResponse = await getUserDetails(userId);
        const username = userResponse.data.username || "Student";
        setStudentName(username);
      } catch (userError) {
        console.warn("Could not fetch user details:", userError);
        // Continue execution with default name
      }
      
      // Get enrolled courses with better error handling
      let courses = [];
      try {
        const coursesResponse = await getMyCourses();
        courses = Array.isArray(coursesResponse.data) ? coursesResponse.data : [];
      } catch (coursesError) {
        console.warn("Could not fetch courses:", coursesError);
        // Don't show error toast, just use empty courses array
      }
      
      // Calculate dashboard metrics
      const totalAssignments = courses.reduce(
        (total, course) => total + (course.assignments?.length || 0), 
        0
      );
      
      // Extract upcoming deadlines
      const now = new Date();
      const deadlines = courses
        .filter(course => course && course.deadline)
        .map(course => ({
          title: course.name || "Unnamed Course",
          course: course.name || "Unnamed Course",
          due: calculateDueTime(new Date(course.deadline), now),
          urgent: isUrgent(new Date(course.deadline), now),
          courseId: course._id
        }))
        .filter(deadline => {
          const foundCourse = courses.find(c => c._id === deadline.courseId);
          if (!foundCourse || !foundCourse.deadline) return false;
          
          const dueDate = new Date(foundCourse.deadline);
          return dueDate > now || (dueDate < now && dueDate > new Date(now - 24 * 60 * 60 * 1000));
        })
        .sort((a, b) => {
          const courseA = courses.find(c => c._id === a.courseId);
          const courseB = courses.find(c => c._id === b.courseId);
          if (!courseA || !courseB || !courseA.deadline || !courseB.deadline) return 0;
          return new Date(courseA.deadline) - new Date(courseB.deadline);
        });

      // Generate recent activities based on courses
      const recentActivities = generateRecentActivities(courses);

      // Generate some sample achievements
      const achievements = generateAchievements(courses);

      // Set dashboard data
      setDashboardData({
        enrolledCourses: courses.length,
        assignments: totalAssignments,
        upcomingDeadlines: deadlines,
        averageGrade: calculateAverageGrade(courses),
        recentActivities,
        achievements
      });
      
      // Allow toasts to be shown only after successful data loading for first time
      setShowToasts(true);
    } catch (error) {
      console.error("Failed to fetch student data:", error);
      setError("Could not load dashboard data. Please refresh the page.");
      // Don't show toast on initial load to prevent toast spam
      if (showToasts) {
        toast.error("Failed to load your data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [showToasts]);

  // Initial data fetch
  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  // Helper functions
  const calculateDueTime = (deadline, now) => {
    if (!deadline || isNaN(deadline.getTime())) {
      return "Unknown";
    }
    
    const diffTime = Math.abs(deadline - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (deadline < now) {
      return diffDays <= 1 ? "Past due" : `${diffDays} days ago`;
    } else if (diffDays <= 1) {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      return diffHours <= 24 ? `${diffHours} hours` : "1 day";
    } else {
      return `${diffDays} days`;
    }
  };

  const isUrgent = (deadline, now) => {
    if (!deadline || isNaN(deadline.getTime())) {
      return false;
    }
    const diffTime = deadline - now;
    return diffTime > 0 && diffTime < 2 * 24 * 60 * 60 * 1000; // Less than 2 days
  };

  const calculateAverageGrade = (courses) => {
    // Simulate a grade between 75-95
    return courses.length > 0 ? Math.floor(75 + Math.random() * 20) : 0;
  };

  const generateRecentActivities = (courses) => {
    const activities = [];
    
    if (!Array.isArray(courses) || courses.length === 0) {
      return activities;
    }
    
    // Only use the most recent courses
    const recentCourses = [...courses]
      .filter(course => course && (course.createdAt || course.deadline))
      .sort((a, b) => {
        const dateA = new Date(b.createdAt || b.deadline || 0);
        const dateB = new Date(a.createdAt || a.deadline || 0);
        return dateA - dateB;
      })
      .slice(0, 3);
    
    // Create enrollment activities
    recentCourses.forEach((course, index) => {
      const dayOffset = index * 2;
      
      activities.push({
        type: "enrollment",
        title: course.name || "Unnamed Course",
        time: dayOffset === 0 ? "Today" : dayOffset === 1 ? "Yesterday" : `${dayOffset} days ago`
      });
    });
    
    // Add an assignment activity if there are assignments
    if (courses.some(course => course.assignments && course.assignments.length > 0)) {
      const courseWithAssignments = courses.find(course => 
        course.assignments && course.assignments.length > 0
      );
      
      if (courseWithAssignments) {
        activities.push({
          type: "assignment",
          title: `${courseWithAssignments.name || "Course"} Assignment`,
          time: "3 days ago"
        });
      }
    }
    
    // Add a grade update activity
    if (courses.length > 0) {
      activities.push({
        type: "grade",
        title: `${courses[0].name || "Course"}: ${75 + Math.floor(Math.random() * 20)}%`,
        time: "5 days ago"
      });
    }
    
    return activities.slice(0, 3);
  };

  // Generate sample achievements to make the dashboard more engaging
  const generateAchievements = (courses) => {
    const achievements = [];
    
    if (courses.length >= 1) {
      achievements.push({
        icon: <BookMarked size={20} />,
        title: "First Steps",
        description: "Enrolled in your first course",
        earned: true
      });
    }
    
    if (courses.length >= 3) {
      achievements.push({
        icon: <BookOpen size={20} />,
        title: "Knowledge Seeker",
        description: "Enrolled in 3+ courses",
        earned: true
      });
    }
    
    // Always add some aspirational achievements
    achievements.push({
      icon: <Award size={20} />,
      title: "Honor Roll",
      description: "Achieve 90% or higher in all courses",
      earned: false
    });
    
    achievements.push({
      icon: <Laptop size={20} />,
      title: "Digital Scholar",
      description: "Complete 5 online assignments",
      earned: courses.length > 0
    });
    
    return achievements;
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  // Render a calendar event component
  const CalendarEvent = ({ title, date, type }) => (
    <div className={`calendar-event ${type}`}>
      <div className="event-marker"></div>
      <div className="event-content">
        <h4>{title}</h4>
        <p>{date}</p>
      </div>
    </div>
  );

  // Only display the spinner or error message when actually loading or errored
  if (loading) {
    return (
      <>
        <NavBar />
        <div className="dashboard-container">
          <Sidebar role="Student" />
          <main className="main-content">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading your dashboard...</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavBar />
        <div className="dashboard-container">
          <Sidebar role="Student" />
          <main className="main-content">
            <div className="error-container">
              <div className="error-icon">
                <AlertTriangle size={36} />
              </div>
              <h2>Something went wrong</h2>
              <p>{error}</p>
              <button className="retry-button" onClick={fetchStudentData}>
                Retry
              </button>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Student" />
        <main className="main-content">
          <div className="welcome-section">
            <div className="welcome-content">
              <h1 className="welcome-header">Welcome back, {studentName}!</h1>
              <p className="welcome-description">
                Your academic hub for course management, assignments, and progress tracking.
              </p>
              <div className="welcome-actions">
                <button 
                  className="primary-action-btn"
                  onClick={() => navigateTo("/student/my-courses")}
                >
                  <BookOpen size={18} className="btn-icon" /> View My Courses
                </button>
                <button 
                  className="secondary-action-btn"
                  onClick={() => navigateTo("/student/courses")}
                >
                  <ClipboardList size={18} className="btn-icon" /> Browse Courses
                </button>
              </div>
            </div>
            <div className="welcome-decoration">
              <div className="decoration-circle"></div>
              <div className="decoration-circle"></div>
            </div>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <BookOpen size={24} />
              </div>
              <div className="stat-content">
                <h3>Enrolled Courses</h3>
                <p className="stat-value">{dashboardData.enrolledCourses}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <ClipboardList size={24} />
              </div>
              <div className="stat-content">
                <h3>Assignments</h3>
                <p className="stat-value">{dashboardData.assignments}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <CalendarDays size={24} />
              </div>
              <div className="stat-content">
                <h3>Upcoming Deadlines</h3>
                <p className="stat-value">{dashboardData.upcomingDeadlines.length}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <BarChart3 size={24} />
              </div>
              <div className="stat-content">
                <h3>Average Grade</h3>
                <p className="stat-value">
                  {dashboardData.averageGrade > 0 ? `${dashboardData.averageGrade}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="dashboard-grid">
            <div className="dashboard-column">
              <div className="recent-activity-container">
                <h2 className="section-title">Recent Activity</h2>
                <div className="activity-list">
                  {dashboardData.recentActivities.length > 0 ? (
                    dashboardData.recentActivities.map((activity, index) => (
                      <div className="activity-item" key={index}>
                        <div className="activity-icon">
                          {activity.type === "assignment" && <FileCheck size={20} />}
                          {activity.type === "enrollment" && <BookOpen size={20} />}
                          {activity.type === "grade" && <GraduationCap size={20} />}
                        </div>
                        <div className="activity-details">
                          <h4 className="activity-title">
                            {activity.type === "assignment" && "Assignment Submitted"}
                            {activity.type === "enrollment" && "Course Enrolled"}
                            {activity.type === "grade" && "Grade Updated"}
                          </h4>
                          <p className="activity-description">{activity.title}</p>
                          <p className="activity-time">{activity.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-activities">
                      <p>No recent activities to display.</p>
                      <p>Enroll in courses to start seeing your activities here!</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="achievements-container">
                <h2 className="section-title">My Achievements</h2>
                <div className="achievements-grid">
                  {dashboardData.achievements.map((achievement, index) => (
                    <div key={index} className={`achievement-card ${achievement.earned ? 'earned' : 'locked'}`}>
                      <div className="achievement-icon">
                        {achievement.icon}
                      </div>
                      <div className="achievement-details">
                        <h4>{achievement.title}</h4>
                        <p>{achievement.description}</p>
                      </div>
                      <div className="achievement-status">
                        {achievement.earned ? (
                          <span className="earned-badge">Earned</span>
                        ) : (
                          <span className="locked-badge">In Progress</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="dashboard-column">
              <div className="deadlines-container">
                <h2 className="section-title">
                  Upcoming Deadlines
                  {dashboardData.upcomingDeadlines.length > 0 && (
                    <span className="view-all" onClick={() => navigateTo("/student/my-courses")}>
                      View all <ChevronRight size={16} />
                    </span>
                  )}
                </h2>
                <div className="deadlines-list">
                  {dashboardData.upcomingDeadlines.length > 0 ? (
                    dashboardData.upcomingDeadlines.map((deadline, index) => (
                      <div 
                        className={`deadline-item ${deadline.urgent ? 'urgent' : ''}`}
                        key={index}
                        onClick={() => navigateTo(`/course/${deadline.courseId}`)}
                      >
                        <h4 className="deadline-title">{deadline.title}</h4>
                        <p className="deadline-course">{deadline.course}</p>
                        <div className="deadline-meta">
                          <p className={`deadline-due ${deadline.urgent ? 'urgent' : ''}`}>
                            <Clock size={16} /> Due in {deadline.due}
                          </p>
                          <span className="deadline-view">
                            <ArrowUpRight size={16} />
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-deadlines-message">
                      <CheckCircle size={24} />
                      <p>No upcoming deadlines!</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="calendar-preview">
                <h2 className="section-title">Academic Calendar</h2>
                <div className="calendar-container">
                  <div className="month-header">
                    <h3>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                  </div>
                  <div className="calendar-events">
                    <CalendarEvent 
                      title="Assignment Due" 
                      date="Today" 
                      type="urgent" 
                    />
                    <CalendarEvent 
                      title="Course Registration" 
                      date="Tomorrow" 
                      type="info" 
                    />
                    <CalendarEvent 
                      title="Midterm Exam" 
                      date="In 5 days" 
                      type="warning" 
                    />
                  </div>
                  <button 
                    className="view-calendar-btn"
                    onClick={() => navigateTo("/student/my-courses")}
                  >
                    View Full Calendar
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="quick-actions">
            <button className="action-button" onClick={() => navigateTo("/student/courses")}>
              <BookOpen size={18} /> Browse Available Courses
            </button>
            <button className="action-button" onClick={() => navigateTo("/student/my-courses")}>
              <ClipboardList size={18} /> Manage Assignments
            </button>
            <button className="action-button" onClick={() => navigateTo("/student/profile")}>
              <LineChart size={18} /> View Profile
            </button>
          </div>
        </main>
      </div>
    </>
  );
};

export default StudentDashboard;