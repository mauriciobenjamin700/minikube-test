/**
 * Class representing a User in the database.
 * 
 * Attributes:
 * 
 * - name: The name of the user.
 * - email: The email address of the user.
 * - password: The password of the user.
 * - created_at: The date and time when the user was created.
 */
class UserModel {
    constructor(
        public id: number,
        public name: string,
        public email: string,
        public password: string,
        public created_at: Date
    ) { }
    /**
     * Returns the string representation of the UserModel instance.
     * 
     * @returns {string} The string representation of the UserModel instance.
     */
    toString(): string {
        return `UserModel { id: ${this.id}, name: ${this.name}, email: ${this.email}, password: ${this.password}, created_at: ${this.created_at} }`;
    }
    toJSON(): string {
        return JSON.stringify({
            id: this.id,
            name: this.name,
            email: this.email,
            created_at: this.created_at
        });
    }
}

export default UserModel;