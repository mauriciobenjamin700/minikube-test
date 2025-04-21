import { UnprocessableEntityError } from "@/core/errors";
import UserService from "@/services/user";
import { UserLogin, UserRegister } from "@/types/user"
import { handleError } from "@/core/handlers";


export async function GET(request: Request) {
    try {
        // Extrai os parâmetros da URL
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");
        const password = searchParams.get("password");

        // Valida os parâmetros obrigatórios
        if (!email || !password) {
            throw new UnprocessableEntityError("Required fields are missing, please send the email and password");
        }

        const body: UserLogin = {
            email,
            password
        };

        const service = new UserService();

        const user = await service.login(body);

        return new Response(user.toJSON(), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });

    } catch (error: any) {
        console.log("error: ", error);
        return handleError(error);
    }

}

export async function POST(request: Request) {
    try {

        const body: UserRegister = await request.json();

        const service = new UserService();

        const newUser = await service.register(body);


        return new Response(newUser.toJSON(), {
            status: 201,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error: any) {
        console.log("error: ", error);
        return handleError(error);
    }

}