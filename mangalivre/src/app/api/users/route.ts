export async function GET(request: Request) {

    console.log("GET request received");
    console.log(request);
    console.log(request.url);

    const users = [
        {
            id: "1",
            name: "John Doe",
            email: "joe.doe@gmai.com"
        },
        {
            id: "2",
            name: "Jane Doe",
            email: "jane.doe@gmail.com"
        }
    ];

    return new Response(JSON.stringify(users), {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        }
    });

}

export async function POST(request: Request) {
    const body = await request.json();

    const { name } = body;

    const newUser = {
        id: Date.now().toString(),
        name
    }

    return new Response(JSON.stringify(newUser), {
        status: 201,
        headers: {
            "Content-Type": "application/json"
        }
    });
}