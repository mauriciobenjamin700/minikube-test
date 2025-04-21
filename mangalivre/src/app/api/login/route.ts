import { handleError } from "@/core/handlers";
import UserService from "@/services/user";
import { UserLogin } from "@/types/user";

export async function POST(request: Request) {
    try {

        const body: UserLogin = await request.json();

        const service = new UserService();

        const newUser = await service.login(body);


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