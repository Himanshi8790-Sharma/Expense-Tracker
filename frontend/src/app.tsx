import "./app.css";
import Login from "./pages/Login";
import { BrowserRouter,Routes,Route,Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

const isAuth = ()=>{
  return localStorage.getItem("token");
}

const ProtectedRoute = ({children}:any)=>{
  return isAuth() ? children : <Navigate to ="/"/>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;