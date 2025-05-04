
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { getUserDetails, getMyCourses } from "../../services/api";
import { toast } from "react-toastify";
import { 
  BookOpen, Calendar, ClipboardList, 
  Clock, AlertTriangle, Bell,
  ChevronRight, User, BellRing
} from "lucide-react";
import "../../styles/StudentDashboard.css";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

const StudentDashboard = () => {
  const [studentName, setStudentName] = useState("Student");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    enrolledCourses: 0,
    assignments: 0,
    upcomingDeadlines: [],
    recentActivities: [],
    notices: []
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
        console.log("Fetched student name:", username); // Debug log
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
      
      // Generate notices based on real course data
      const notices = generateNotices(courses);

      // Set dashboard data
      setDashboardData({
        enrolledCourses: courses.length,
        assignments: totalAssignments,
        upcomingDeadlines: deadlines,
        recentActivities,
        notices
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
    
    return activities.slice(0, 3);
  };

  // Generate notices based on real course data
  const generateNotices = (courses) => {
    const notices = [];
    
    // Add an important upcoming deadline notice if there's an urgent deadline
    const urgentDeadlines = courses
      .filter(course => course && course.deadline)
      .filter(course => {
        const deadline = new Date(course.deadline);
        const now = new Date();
        const diffTime = deadline - now;
        return diffTime > 0 && diffTime < 5 * 24 * 60 * 60 * 1000; // Less than 5 days
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    if (urgentDeadlines.length > 0) {
      const mostUrgentCourse = urgentDeadlines[0];
      notices.push({
        title: "Upcoming Deadline",
        content: `${mostUrgentCourse.name} deadline is approaching. Make sure to submit your work on time.`,
        date: formatDate(new Date()),
        important: true
      });
    }
    
    // Add a notice about new courses if there are any recent courses
    const recentCourses = courses
      .filter(course => course && course.createdAt)
      .filter(course => {
        const createdDate = new Date(course.createdAt);
        const now = new Date();
        const diffTime = now - createdDate;
        return diffTime <= 7 * 24 * 60 * 60 * 1000; // Created within the last 7 days
      });
    
    if (recentCourses.length > 0) {
      notices.push({
        title: "New Courses Available",
        content: `${recentCourses.length} new course${recentCourses.length === 1 ? '' : 's'} ${recentCourses.length === 1 ? 'has' : 'have'} been added to your curriculum.`,
        date: formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
        important: false
      });
    }
    
    // Add a notice about system maintenance if the user has been active
    if (localStorage.getItem("userId")) {
      notices.push({
        title: "System Maintenance",
        content: "The system will undergo maintenance this weekend. Some features may be temporarily unavailable.",
        date: formatDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)), // 4 days ago
        important: false
      });
    }
    
    // Add a welcome notice for new students with 0-1 courses
    if (courses.length <= 1) {
      notices.push({
        title: "Welcome to the Learning Portal",
        content: "Welcome to your academic dashboard! You can track your courses, assignments, and progress here.",
        date: formatDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
        important: false
      });
    }
    
    return notices;
  };
  
  const formatDate = (date) => {
    if (!date || isNaN(date.getTime())) return "Unknown";
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const navigateTo = (path) => {
    navigate(path);
  };

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
        <main className="main-content animate-fade-in">
          <h2 className="dashboard-title">
            <span className="welcome-wave">👋</span> Welcome back, {studentName}!
          </h2>

          {/* Stats Container with Animation */}
          <div className="stats-container animate-fade-in">
            {/* Enrolled Courses */}
            <div className="stat-card animate-pop" style={{"--index": 1}}>
              <div className="stat-icon">
                <BookOpen size={28} />
              </div>
              <div className="stat-content">
                <h3>{dashboardData.enrolledCourses}</h3>
                <p>Total Courses</p>
              </div>
            </div>
            
            {/* Assignments */}
            <div className="stat-card animate-pop" style={{"--index": 2}}>
              <div className="stat-icon">
                <ClipboardList size={28} />
              </div>
              <div className="stat-content">
                <h3>{dashboardData.assignments}</h3>
                <p>Assignments</p>
              </div>
            </div>
            
            {/* Upcoming Deadlines */}
            <div className="stat-card animate-pop" style={{"--index": 3}}>
              <div className="stat-icon">
                <Calendar size={28} />
              </div>
              <div className="stat-content">
                <h3>{dashboardData.upcomingDeadlines.length}</h3>
                <p>Upcoming Deadlines</p>
              </div>
            </div>
          </div>

          {/* Notice Board */}
          <Card className="notice-board-card animate-slide-in">
            <div className="notice-header">
              <div className="notice-board-icon">
                <Bell size={20} />
              </div>
              <h3 className="notice-title">Notice Board</h3>
            </div>
            <CardContent>
              <div className="notice-list">
                {dashboardData.notices && dashboardData.notices.length > 0 ? (
                  dashboardData.notices.map((notice, index) => (
                    <div 
                      key={index}
                      className={`notice-item ${notice.important ? 'important' : ''} animate-pop`}
                      style={{"--index": index + 1}}
                    >
                      <div className="notice-header-content">
                        <h4 className="notice-item-title">
                          {notice.important ? 
                            <BellRing size={18} className="icon" /> : 
                            <Bell size={18} className="icon" />
                          }
                          {notice.title}
                        </h4>
                        <span className="notice-date">{notice.date}</span>
                      </div>
                      <p className="notice-content">{notice.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="no-notices">
                    <Bell size={24} />
                    <p>No notices available at this time.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Courses Section */}
          <div className="courses-section animate-slide-in">
            <h3 className="section-title">
              <BookOpen className="section-icon" size={20} /> Your Courses
              <span className="view-all" onClick={() => navigateTo("/student/my-courses")}>
                View all <ChevronRight size={16} />
              </span>
            </h3>
            
            {dashboardData.upcomingDeadlines.length > 0 && (
              <div className="upcoming-deadlines">
                <h4 className="subsection-title">
                  <Clock size={18} /> Upcoming Deadlines
                </h4>
                <div className="deadlines-list">
                  {dashboardData.upcomingDeadlines.map((deadline, index) => (
                    <div 
                      className={`deadline-item ${deadline.urgent ? 'urgent' : ''} animate-pop`}
                      key={index}
                      onClick={() => navigateTo(`/course/${deadline.courseId}`)}
                      style={{"--index": index + 1}}
                    >
                      <h4 className="deadline-title">{deadline.title}</h4>
                      <p className="deadline-course">{deadline.course}</p>
                      <div className="deadline-meta">
                        <p className={`deadline-due ${deadline.urgent ? 'urgent' : ''}`}>
                          <Clock size={16} /> Due in {deadline.due}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="action-buttons">
              <Button 
                className="action-button" 
                onClick={() => navigateTo("/student/courses")}
                style={{"--index": 1}}
              >
                <BookOpen size={18} /> Browse All Courses
              </Button>
              <Button
                className="action-button"
                variant="outline"
                onClick={() => navigateTo("/student/profile")}
                style={{"--index": 2}}
              >
                <User size={18} /> View Profile
              </Button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default StudentDashboard;