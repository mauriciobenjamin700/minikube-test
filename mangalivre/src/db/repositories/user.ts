import { Pool } from "pg"; // Importa o Pool do pg
import pool from "@/db";
import UserModel from "../models/user";
import { UserRegister } from "@/types/user";

/**
 * Class representing a User repository.
 * 
 * This class provides methods to interact with the users table in the database.
 * 
 * Methods:
 *  - add(data: UserRegister): Promise<UserModel>: Adds a new user to the database.
 *  - getById(id: number): Promise<UserModel | null>: Retrieves a user by their ID.
 *  - getByEmail(email: string): Promise<UserModel | null>: Retrieves a user by their email.
 *  - getAll(): Promise<UserModel[]>: Retrieves all users from the database.
 *  - delete(id: number): Promise<void>: Deletes a user by their ID.
 */
class UserRepository {
    private db: Pool;
    constructor() {
        this.db = pool;
    }

    async add(data: UserRegister): Promise<UserModel> {
        const query = `
            INSERT INTO users (name, email, password)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const result = await this.db.query(query, [data.name, data.email, data.password]);

        const model = new UserModel(
            result.rows[0].id,
            result.rows[0].name,
            result.rows[0].email,
            result.rows[0].password,
            result.rows[0].created_at
        );
        return model; // Retorna o usuário criado

    }
    async getById(id: number): Promise<UserModel | null> {
        const query = `
            SELECT * FROM users
            WHERE id = $1
        `;
        const result = await this.db.query(query, [id]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            return new UserModel(
                user.id,
                user.name,
                user.email,
                user.password,
                user.created_at
            );
        }
        return null; // Retorna null se não encontrar o usuário
    }

    async getByEmail(email: string): Promise<UserModel | null> {
        const query = `
            SELECT * FROM users
            WHERE email = $1
        `;
        const result = await this.db.query(query, [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            return new UserModel(
                user.id,
                user.name,
                user.email,
                user.password,
                user.created_at
            );
        }
        return null; // Retorna null se não encontrar o usuário
    }

    async getAll(): Promise<UserModel[]> {
        const query = `
            SELECT * FROM users
        `;
        const result = await this.db.query(query);
        const users: UserModel[] = result.rows.map((user: UserModel) => {
            return new UserModel(
                user.id,
                user.name,
                user.email,
                user.password,
                user.created_at
            );
        });
        return users; // Retorna todos os usuários
    }

    async delete(id: number): Promise<void> {
        const query = `
            DELETE FROM users
            WHERE id = $1
        `;
        await this.db.query(query, [id]);
    }

}

export default UserRepository;