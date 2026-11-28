import { Button } from "@/components/ui/button"
import { useState } from "react";


export const LR = () => {
    const [showForm, setShowForm] = useState(false);

    const handleCreateLr = () => {
        setShowForm(true);
    };

    const handleBack = () => {
        setShowForm(false);
    };

    const handleSubmitLr = (e) => {
        e.preventDefault();
        // API call to save LR
    };

    return (
        <div className="min-h-screen w-full p-3 sm:p-6">

            {showForm ? (
                // Generate LR Form
                <div className="space-y-4">

                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold sm:text-2xl">
                            Generate LR
                        </h1>

                        <Button
                            onClick={handleBack}
                            className="border border-blue-300 bg-transparent text-blue-300 hover:bg-blue-300 hover:text-white"
                        >
                            Back
                        </Button>
                    </div>

                    <div className="rounded-lg border bg-background p-4 shadow-sm sm:p-6">
                        <form onSubmit={handleSubmitLr}>
                            {/* Add your LR form fields here */}

                            <Button
                                type="submit">
                                Save LR
                            </Button>
                        </form>
                    </div>

                </div>
            ) : (
                // Existing LR List
                <div className="space-y-4">

                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold sm:text-2xl">
                            LR Records
                        </h1>

                        <Button
                            className="border border-blue-300 bg-blue-300 text-black hover:bg-blue-300 hover:text-white"
                            onClick={handleCreateLr}>
                            Generate LR
                        </Button>
                    </div>

                    {/* Existing LRs will be displayed here */}
                    <div className="rounded-lg border p-6">
                        <p className="text-muted-foreground">
                            No LR records found.
                        </p>
                    </div>

                </div>
            )}

        </div>
    )
}

export default LR