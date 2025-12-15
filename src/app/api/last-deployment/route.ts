import {NextRequest, NextResponse} from "next/server";
import {repository} from "@/lib/repository";
import {z} from "zod";

const schema = z.object({
    programa: z.string().min(1),
    entorno: z.enum(['Preproducción', 'Producción']),
});

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url);
    const result = schema.safeParse({
        programa: searchParams.get("programa"),
        entorno: searchParams.get("entorno"),
    });

    if (!result.success) {
        return NextResponse.json({error: "Invalid parameters", issues: result.error.issues}, {status: 400});
    }
    
    const { programa, entorno } = result.data;

    const lastDeployment = await repository.getLastDeployment(programa, entorno);

    if (!lastDeployment) {
        return NextResponse.json({error: "Not found"}, {status: 404});
    }

    return NextResponse.json(lastDeployment);
}
