import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { LogOut, Menu, Package2, UserCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"

const navLinks = [
    { name: "LC ", href: "/lc" },
    { name: "Bill", href: "/bill" },
    { name: "Challan", href: "/challan" },
]

export const Navbar = ({ user, setUser }) => {
    const [open, setOpen] = useState(false)
    const [accountOpen, setAccountOpen] = useState(false)

    const navigate = useNavigate()

    const isLoggedIn = user && Object.keys(user).length > 0

    const handleLogout = () => {
        setUser({})
        setAccountOpen(false)
        navigate("/login", { replace: true })
    }

    return (
        <nav className="fixed w-full border-b bg-background">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <Package2 className="h-7 w-7" />
                    <span className="text-xl font-bold">Store</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden items-center gap-8 md:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.href}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Desktop Buttons */}
                <div className="hidden items-center gap-3 md:flex">
                    {isLoggedIn ? (
                        <div className="relative">
                            <Button
                                variant="ghost"
                                onClick={() => setAccountOpen(!accountOpen)}
                                className="flex items-center gap-2"
                            >
                                <UserCircle className="h-6 w-6" />
                                <span>{user.name || "My Account"}</span>
                            </Button>

                            {accountOpen && (
                                <div className="absolute right-0 top-12 z-50 w-44 rounded-md border bg-background p-2 shadow-lg">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-2"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Button asChild>
                            <Link to="/login">Login</Link>
                        </Button>
                    )}
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>

                        <SheetContent side="right">
                            <div className="mt-8 pl-2 flex flex-col gap-6">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        to={link.href}
                                        onClick={() => setOpen(false)}
                                        className="text-base font-medium"
                                    >
                                        {link.name}
                                    </Link>
                                ))}

                                <div className="flex pr-2 flex-col gap-3">
                                    {isLoggedIn ? (
                                        <Button
                                            className="w-full justify-start gap-2"
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </Button>
                                    ) : (
                                        < Button asChild >
                                            <Link to="/login">Login</Link>
                                        </Button>
                                    )
                                    }
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

            </div>
        </nav >
    )
}

export default Navbar