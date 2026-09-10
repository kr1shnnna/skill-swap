import Navbar from "./components/Navbar/Navbar"
import Home from "./pages/Home/Home"
import { Routes, Route } from "react-router-dom"
import Login from "./pages/Login/Login"
import Register from "./pages/Register/Register"
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/Profile/Profile";
import FindSkills from "./pages/FindSkills/FindSkills";
import StudentProfile from "./pages/StudentProfile/StudentProfile";
import SwapRequests from "./pages/SwapRequests/SwapRequests";







const App = () => {
  return (
     <>
     <Navbar />
     <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />

      <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
  path="/find-skills"
  element={
    <ProtectedRoute>
      <FindSkills />
    </ProtectedRoute>
  }
/>

<Route
  path="/profile/:userId"
  element={
    <ProtectedRoute>
      <StudentProfile />
    </ProtectedRoute>
  }
/>

<Route
  path="/swap-requests"
  element={
    <ProtectedRoute>
      <SwapRequests />
    </ProtectedRoute>
  }
/>


        

     </Routes>

   
    </>
  )
}

export default App