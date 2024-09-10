// import { useEffect } from 'react'
import './App.css'
import {BrowserRouter as Router , Route , Routes} from 'react-router-dom'
import { SocketProvider } from './SocketContext'
import Homepage from './components/Homepage'
import 'react-toastify/dist/ReactToastify.css';
import Chatbox from './components/Chatbox';
function App() {

  return (
    <Router>
      <SocketProvider>
        <Routes>
          <Route path='/' element={<Homepage/>}/>
          <Route path='/chatbox' element={<Chatbox/>}/>
        </Routes>
      </SocketProvider>

    </Router>
  )
}

export default App
