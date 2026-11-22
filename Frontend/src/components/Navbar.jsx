import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, Package2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"

const navLinks = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
]

function Navbar() {
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()

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
                    <Button variant="ghost">Login</Button>
                    <Button>Sign Up</Button>
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
                            <div className="mt-8 flex flex-col gap-6">
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

                                <div className="flex flex-col gap-3">
                                    <Button variant="ghost" asChild onClick={() => { navigate("/login") }}>
                                        <Link to="/login">Login</Link>
                                    </Button>
                                    <Button onClick={() => { navigate("/signup") }}>Sign Up</Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

            </div>
        </nav>
    )
}

export default Navbar