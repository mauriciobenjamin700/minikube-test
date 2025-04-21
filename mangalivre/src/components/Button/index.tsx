import styles from "./styles.module.css";

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    color?: string;
}

export default function Button({ children, onClick, color, type = "button" }: ButtonProps) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={styles.button}
            style={color ? { backgroundColor: color } : {}}
        >
            {children}
        </button>
    );
}