"use client";

import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link"; // Importando o Link
import Form from "@/components/Form";
import Button from "@/components/Button";
import { UserLogin } from "@/types/user";
import { useDispatch } from "react-redux";
import { redirect } from "next/navigation";


export default function Login() {

  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const userData: UserLogin = { email, password };

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      const user = await response.json();
      console.log("user: ", user);
      dispatch({ type: "user/login", payload: user });
      redirect("/"); // Redireciona para a página inicial após o login
    } else {
      const errorData = await response.json();
      alert(errorData.message || "Erro ao fazer login");
    }
  };

  return (
    <main>
      <h1
        className={styles.title}
      >
        Seja bem-vindo ao MangaLivre!
      </h1>
      <Form
        onSubmit={handleSubmit}
      >
        <Image
          className={styles.logo}
          src="/logo.png"
          alt="Logo do MangaLivre"
          width={100}
          height={100}
        />
        <label htmlFor="email">Email:</label>
        <input type="email" id="email" name="email" required />
        <br />
        <label htmlFor="password">Senha:</label>
        <input type="password" id="password" name="password" required />
        <br />
        <div className={styles.formButtonContainer}>
          <Button
            type="submit">
            Entrar
          </Button>
          <Link href="/register">
            <Button type="button">
              Registrar
            </Button>
          </Link>
        </div>
        <br />
      </Form>
    </main >
  );
}
