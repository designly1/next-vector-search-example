interface TurnstileResponse {
    success: boolean;
}

export async function checkTurnstileToken(token: string) {
    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    const formData = new FormData();
    formData.append('secret', process.env.TURNSTILE_SECRET || '');
    formData.append('response', token);

    try {
        const result = await fetch(url, {
            body: formData,
            method: 'POST',
        });

        const outcome = await result.json() as TurnstileResponse;
        console.log(outcome);
        if (outcome.success) {
            return true;
        }
    } catch (err) {
        console.error(err);
    }
    return false;
}