"use client";

import Hearder from "@/components/Header";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function HomePage() {

    const user = useSelector((state: RootState) => state.user.user);

    useEffect(() => {
        if (!user) {
            redirect("/login"); // Redireciona para login se o usuário não estiver logado
        }
    }, [user]);

    if (!user) {
        return null; // Evita renderizar a página enquanto redireciona
    }

    return (
        <main>
            <Hearder userName={user.name} />
        </main>
    )
}