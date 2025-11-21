
import {NextRequest, NextResponse} from "next/server";
import {getLastDeployment} from "@/lib/data";

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url);
    const programa = searchParams.get("programa");
    const entorno = searchParams.get("entorno");

    if (!programa || !entorno) {
        return NextResponse.json({error: "Missing parameters"}, {status: 400});
    }

    const lastDeployment = await getLastDeployment(programa, entorno);

    if (!lastDeployment) {
        return NextResponse.json({error: "Not found"}, {status: 404});
    }

    return NextResponse.json(lastDeployment);
}
