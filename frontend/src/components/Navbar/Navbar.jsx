import {Link} from 'react-router-dom'
import './Navbar.css'
const Navbar = () => {
  return (
    
    <nav className='navbar'>

        <Link to='/' className='navbar-logo'>
            Skill <span>Swap</span>
        </Link>

        <div className="navbar-links">
            <Link to='/' href="#">Home</Link>
            <Link to ='/find-skills'>Find Skills</Link>
            <Link to='/how-it-works'>How it Works</Link>
        </div>

        <div className="navbar-actions">
            <Link to='/login' className='login-btn'>Login</Link>
            <Link to='/register' className='signup-btn'>Get Started</Link>
        </div>
    </nav>
  )
}

export default Navbar