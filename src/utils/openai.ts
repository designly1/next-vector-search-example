import { Configuration, OpenAIApi } from "openai";

const config = new Configuration({
    apiKey: process.env.OPENAI_KEY,
    organization: process.env.OPENAI_ORG,
});

// Create embedding from string
export const createEmbedding = async (text: string) => {
    const openai = new OpenAIApi(config);
    const response = await openai.createEmbedding({
        model: 'text-embedding-ada-002',
        input: text,
    });

    return response.data.data[0].embedding;
}