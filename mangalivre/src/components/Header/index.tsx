import Image from "next/image"
import styles from "./styles.module.css"
import Button from "../Button";
import { redirect } from "next/navigation";
import { useDispatch } from "react-redux";

interface headerProps {
    userName: string;
}

export default function Header({ userName = "userName" }: headerProps) {

    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch({ type: "user/logout" });
        redirect("/login");
    }

    const handleLogin = () => {
        redirect("/login");
    }

    return (
        <header className={styles.container}>
            <Image
                src={"/logo.png"}
                alt="Logo do MangaLivre"
                width={75}
                height={75}
            />
            <h1>MangaLivre</h1>
            <div className={styles.userContainer}>
                <p className={styles.userName}>{userName}</p>
                <Image
                    src={"/user.svg"}
                    alt="Logo do MangaLivre"
                    width={75}
                    height={75}
                    onClick={handleLogin}
                    style={{ cursor: "pointer" }}
                />
                <Button
                    color="gray"
                    onClick={handleLogout}
                >
                    Sair
                </Button>
            </div>
        </header>
    )
}