import Navbar from "@/components/Navbar"
import { Outlet } from "react-router-dom"

function MainLayout() {
    return (
        <div className="min-h-screen w-full overflow-x-hidden">
            <Navbar />
            <main>
                <Outlet />
            </main>
        </div>
    )
}

export default MainLayout