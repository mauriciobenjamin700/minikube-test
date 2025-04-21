import { ConflictError, NotFoundError } from "@/core/errors";
import { hashPassword, verifyPassword } from "@/core/security";
import UserModel from "@/db/models/user";
import UserRepository from "@/db/repositories/user";
import { UserLogin, UserRegister } from "@/types/user";

class UserService {
    constructor(
        private repository: UserRepository = new UserRepository()
    ) { }

    async register(data: UserRegister): Promise<UserModel> {

        data.password = hashPassword(data.password);

        const existingUser = await this.repository.getByEmail(data.email);

        if (existingUser) {
            throw new ConflictError("User already exists");
        }

        const user = await this.repository.add(data);
        return user;
    }

    async login(data: UserLogin): Promise<UserModel> {
        const user = await this.repository.getByEmail(data.email);
        if (!user) {
            throw new NotFoundError("Invalid email or password");
        }
        if (!verifyPassword(data.password, user.password)) {
            throw new NotFoundError("Invalid email or password");
        }
        return user;
    }
}

export default UserService;