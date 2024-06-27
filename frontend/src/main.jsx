import React from 'react'
import ReactDOM from 'react-dom/client'
import {Route, Routes,BrowserRouter } from 'react-router-dom';
import SignUp from "../components/SignUp";
import Home from "../components/Home";
import Chat from "../components/Chat";
import Login from "../components/Login";
import PrivateRoute from "../components/PrivateRoute";
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/signup" element={<SignUp />} />
    <Route path="/chat" element={<PrivateRoute pageToReturn={<Chat/>} />}/>
    <Route path="/login" element={<Login />} />
  </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
