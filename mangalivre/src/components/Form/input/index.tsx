import React, { useState } from "react";
import styles from "./styles.module.css";

type InputProps = {
    type: "text" | "email" | "password" | "number";
    name: string;
    placeholder?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label?: string;
};

const Input: React.FC<InputProps> = ({ type, name, placeholder, value, onChange, label }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleTogglePassword = () => {
        setIsPasswordVisible((prev) => !prev);
    };

    const inputType = type === "password" && isPasswordVisible ? "text" : type;

    return (
        <div className={styles.inputContainer}>
            {label && <label className={styles.label}>{label}</label>}
            <input
                type={inputType}
                placeholder={placeholder}
                value={value}
                name={name}
                onChange={onChange}
                className={styles.input}
            />
            {type === "password" && (
                <button
                    type="button"
                    onClick={handleTogglePassword}
                    className={styles.toggleButton}
                >
                    {isPasswordVisible ? "👁️" : "🔒"}
                </button>
            )}
        </div>
    );
};

export default Input;