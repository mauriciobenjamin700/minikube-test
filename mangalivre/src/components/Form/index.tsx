import React from "react";
import styles from "./styles.module.css";

interface FormProps {
    children: React.ReactNode;
    onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}

const Form: React.FC<FormProps> = ({ children, onSubmit }) => {
    return (
        <div className={styles.formContainer}>
            <form className={styles.form} onSubmit={onSubmit}>
                {children}
            </form>
        </div>
    );
};

export default Form;