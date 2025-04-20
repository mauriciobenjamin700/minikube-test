import Form from "@/components/Form";
import styles from "./page.module.css";
import Button from "@/components/Button";
import Link from "next/link";

export default function RegisterPage() {

    return (
        <main>
            <h1>Registrar</h1>
            <Form>
                <label htmlFor="name">Nome:</label>
                <input type="text" id="name" name="name" required />
                <br />
                <label htmlFor="email">Email:</label>
                <input type="email" id="email" name="email" required />
                <br />
                <label htmlFor="password">Senha:</label>
                <input type="password" id="password" name="password" required />
                <br />
                <label htmlFor="confirmPassword">Confirmar Senha:</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required />
                <br />
                <Button type="submit">Registrar</Button>
                <br />
                <p>Já tem uma conta? <Link className={styles.link} href="/">Entrar</Link></p>
            </Form>
        </main>
    )
}