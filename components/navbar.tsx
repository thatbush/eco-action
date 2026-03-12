'use client'
import React from "react";
import Image from "next/image"
import { useRouter } from "next/navigation";


export const Navbar: React.FC = () => {
    const router = useRouter();
    return (
        <nav className="w-full">
            <header className="hero-header">
                
                <div className="flex items-center logo hover:cursor-pointer"
                onClick={() => router.push('/')}>
                    <Image src="/nobglogo2.png" alt="GreenSteps Logo" width={100} height={100} />
                </div>
                <div className="flex gap-4">
                <button className="btn-ghost" onClick={() => router.push('/register')}>
                    Sign up
                </button>
                <button className="btn-ghost" onClick={() => router.push('/login')}>
                    login
                </button>
                </div>
            </header>
        </nav>
    );
};
