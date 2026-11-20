import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import MainLayout from "./components/MainLayout";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>

          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Routes with Navbar */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App
