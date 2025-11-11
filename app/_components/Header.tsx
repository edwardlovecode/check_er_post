"use client";

import Link from "next/link";

export default function Header() {
    return (
        <div className="h-16 w-full flex justify-center items-center text-xl font-bold gap-4 bg-gradient-to-r from-yellow-300 via-amber-400  text-neutral-900">
            <Link className="hover:text-white" href="/">🔷 Single Post ER</Link> 
            <Link className="hover:text-white" href="/multi-post">🔷 Multi Post ER</Link> 
        </div>
    )
}