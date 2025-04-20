import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link"; // Importando o Link
import Form from "@/components/Form";
import Button from "@/components/Button";

export default function Home() {

  return (
    <main>
      <h1
        className={styles.title}
      >
        Seja bem-vindo ao MangaLivre!
      </h1>
      <Form>
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
        <Button
          type="submit">
          Entrar
        </Button>
        <Link href="/register">
          <Button type="button">
            Registrar
          </Button>
        </Link>
        <br />
      </Form>
    </main >
  );
}
