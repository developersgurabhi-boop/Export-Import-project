
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Package2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

function Login() {
    const [showPassword, setShowPassword] = useState(false)
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('')

    const navigate = useNavigate()

    const handleSubmitLogin = (e) => {
        e.preventDefault()
        console.log("Email:", userEmail);
        console.log("Password:", userPassword);
        // Api call check if the user is correct 
        navigate("/")

        //if wrong user please enter correct email or password

    }

    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-muted/40 px-4 py-10">

            <Card className="w-full max-w-md shadow-lg">

                <CardHeader className="space-y-3 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Package2 size={26} />
                    </div>

                    <CardTitle className="text-2xl font-bold">
                        Welcome Back
                    </CardTitle>

                    <CardDescription>
                        Enter your credentials to access your account
                    </CardDescription>

                </CardHeader>

                <CardContent>

                    <form onSubmit={handleSubmitLogin} className="space-y-5">

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>

                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">

                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>

                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <div className="relative">

                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    required
                                    className="pr-10"
                                    value={userPassword}
                                    onChange={(e) => setUserPassword(e.target.value)}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>

                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-2">
                            <input
                                id="remember"
                                type="checkbox"
                                className="h-4 w-4 accent-primary"
                            />
                            <Label htmlFor="remember" className="text-sm font-normal">
                                Remember me
                            </Label>
                        </div>

                        {/* Login Button */}
                        <Button type="submit" className="w-full" onClick={handleSubmitLogin}>
                            Login
                        </Button>

                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link
                            to="/signup"
                            className="font-semibold text-primary hover:underline"
                        >
                            Sign up
                        </Link>
                    </div>

                </CardContent>

            </Card>

        </div>
    )
}

export default Login
