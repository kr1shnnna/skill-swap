
import './Navbar.css'
const Navbar = () => {
  return (
    
    <nav className='navbar'>

        <div className='navbar-logo'>
            Skill <span>Swap</span>
        </div>

        <div className="navbar-links">
            <a href="#">Home</a>
            <a href="#">Find Skills</a>
            <a href="#">How it Works</a>
        </div>

        <div className="navbar-actions">
            <button className='login-btn'>Login</button>
            <button className='signup-btn'>Get Started</button>
        </div>
    </nav>
  )
}

export default Navbar