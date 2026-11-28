import Navbar from "@/components/Navbar"
import { Outlet } from "react-router-dom"

export const MainLayout = ({ user, setUser }) => {
    return (
        <div className="min-h-screen w-full overflow-x-hidden">
            <Navbar user={user} setUser={setUser} />
            <main className="pt-16">
                <Outlet />
            </main>
        </div>
    )
}

export default MainLayout