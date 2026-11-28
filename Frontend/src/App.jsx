import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import MainLayout from "./components/MainLayout";
import { useState } from "react";
import LR from "./components/LR";
import Bill from "./components/Bill";
import Challan from "./components/Challan";

function App() {
  const [user, setUser] = useState({});
  console.log(user);

  return (
    <>
      <BrowserRouter>
        <Routes>

          {/* Public routes */}
          <Route path="/login" element={<Login setUser={setUser} />} />

          {/* Routes with Navbar */}
          <Route element={<MainLayout user={user} setUser={setUser} />}>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/lr" element={<LR />} />
            <Route path="/bill" element={<Bill />} />
            <Route path="/challan" element={<Challan />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App
