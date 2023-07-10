import { NextResponse } from "next/server";
import Product from "@/models/Products.model";

export async function POST(request: Request) {
    const requestBody = await request.json();
    const { query } = requestBody;
    console.log(requestBody);

    if (!query) {
        return new Response('Missing query', { status: 400 });
    }

    const results = await Product.publicSearch(query);

    return NextResponse.json(results);
}