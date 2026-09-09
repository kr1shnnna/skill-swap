import Navbar from "./components/Navbar/Navbar"
import Home from "./pages/Home/Home"
import { Routes, Route } from "react-router-dom"
import Login from "./pages/Login/Login"
import Register from "./pages/Register/Register"
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Dashboard from "./pages/Dashboard/Dashboard";




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
        
     </Routes>

   
    </>
  )
}

export default App