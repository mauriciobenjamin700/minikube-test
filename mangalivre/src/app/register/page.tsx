"use client";

import Form from "@/components/Form";
import styles from "./page.module.css";
import Button from "@/components/Button";
import Link from "next/link";
import { UserRegister } from "@/types/user";
import { useDispatch } from "react-redux";
import { redirect } from "next/navigation";
import Input from "@/components/Form/input";

export default function RegisterPage() {

    const dispatch = useDispatch();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            alert("As senhas não coincidem");
        }

        else {

            const userData: UserRegister = { name, email, password };

            const response = await fetch("/api/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });

            if (response.ok) {
                const user = await response.json();
                dispatch({ type: "user/login", payload: user });
                redirect("/"); // Redireciona para a página inicial após o login
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Erro ao fazer o cadastro");
            }

        }


    }

    return (
        <main>
            <h1>Registrar</h1>
            <Form onSubmit={handleSubmit}>
                <Input
                    type="text"
                    placeholder="Digite seu nome"
                    name="name"
                    label="Seu Nome"
                />
                <Input
                    type="email"
                    placeholder="Digite seu e-mail"
                    name="email"
                    label="Seu E-mail"
                />
                <Input
                    type="password"
                    placeholder="Digite sua senha"
                    name="password"
                    label="Sua Senha"
                />
                <Input
                    type="password"
                    placeholder="Digite sua senha novamente"
                    name="confirmPassword"
                    label="Confirme sua senha"
                />
                <Button type="submit">Registrar</Button>
                <br />
                <p>Já tem uma conta? <Link className={styles.link} href="/">Entrar</Link></p>
            </Form>
        </main>
    )
}