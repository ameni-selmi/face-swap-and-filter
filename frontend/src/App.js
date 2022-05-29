import './App.css';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import NavBar from './components/Navbar';
import FaceSwapper from './components/FaceSwapper';
import FaceFilter from './components/FaceFilter';
import Home from './components/Home';
function App() {
  return (
      <Router>
        <NavBar/>
        <Routes>
          <Route exact path='/' element={<Home/>}/>
          <Route exact path='/face_swapper' element={<FaceSwapper/>}/>
          <Route exact path='/face_filter' element={<FaceFilter/>}/>
        </Routes>
      </Router>
  );
}

export default App;
