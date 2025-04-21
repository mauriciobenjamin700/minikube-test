import bcrypt from 'bcrypt';


export function hashPassword(password: string): string {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    return bcrypt.hashSync(password, salt);
}

export function verifyPassword(
    password: string,
    hashedPassword: string
): boolean {
    return bcrypt.compareSync(password, hashedPassword);
}