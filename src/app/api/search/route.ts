import { NextResponse } from "next/server";
import Product from "@/models/Products.model";
import { checkTurnstileToken } from "@/utils/captcha";

export async function POST(request: Request) {
    const requestBody = await request.json();
    const { query, token } = requestBody;
    console.log(requestBody);

    if (!query) {
        return new Response('Missing query', { status: 400 });
    }
    if (!token) {
        return new Response('Missing CAPTCHA token', { status: 400 });
    }
    const captchaResult = await checkTurnstileToken(token);
    if (!captchaResult) {
        return new Response('Invalid CAPTCHA response', { status: 400 });
    }

    const results = await Product.publicSearch(query);

    return NextResponse.json(results);
}