import React, { useState } from "react";
import { useStore } from "./store/contextStore";

export const StatusBar: React.FC = () => {
    const [open, setOpen] = useState(false);
    const store = useStore();
    return (
        <div className="w-full fixed bottom-0 text-center">
            <button
                className="btn btn-info bg-opacity-40 min-h-0 -mb-3 w-6 p-0 h-3"
                onClick={() => setOpen(!open)}
            ></button>
            <div
                className={`p-1 bg-slate-300 text-slate-600 text-xs duration-500 text-left ${
                    open ? "h-56 overflow-auto" : "h-5"
                }`}
            >
                <ul className="w-full">
                    {[...(store?.status_message || [])]
                        .reverse()
                        .map((t, i) => (
                            <li
                                key={`_${i}`}
                                className={[
                                    t.includes("Warning")
                                        ? "text-orange-500"
                                        : "",
                                    t.includes("Error") ? "text-red-600" : "",
                                    t.includes("Completed")
                                        ? "text-green-700"
                                        : "",
                                ]
                                    .join(" ")
                                    .trim()}
                            >
                                <pre className="max-w-full">{t.trim()}</pre>
                            </li>
                        ))}
                </ul>
            </div>
        </div>
    );
};
