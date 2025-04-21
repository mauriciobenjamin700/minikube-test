import Image from "next/image"
import styles from "./styles.module.css"

export default function Header() {


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
                <p>UserName</p>
                <Image
                    src={"/user.svg"}
                    alt="User"
                    width={50}
                    height={50}
                />
            </div>
        </header>
    )
}