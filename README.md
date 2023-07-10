In the burgeoning era of artificial intelligence and machine learning, harnessing the power of AI to enhance the capabilities of your web application is no longer a luxury, but a necessity. As developers and data scientists, the onus is on us to stay updated with the dynamic landscape of technology and to create the most efficient and effective tools for our end-users.

Today, we're taking a deep dive into the realm of AI-driven searches, using a powerful tech stack comprising Next.js, Sequelize, PostgreSQL, pgvector, and the OpenAI API. This comprehensive guide aims to equip you with the know-how to build a Next.js application that leverages these robust technologies to deliver advanced, AI-powered searches.

## Semantic Similarity

So how does a vector search work? Here are the steps:

1. **Vectorization**: First, the text (or other data) is converted into vectors. This process, also known as "embedding", uses algorithms such as Word2Vec, FastText, BERT, or other transformers that can capture the context and semantic meaning of words or phrases and represent it in a numerical format. Each unique word or phrase is assigned a unique vector, which is just a set of numbers in a high-dimensional space.
2. **Indexing**: After converting the data to vectors, these vectors are stored in a vector database or a vector index. This index allows us to perform efficient nearest neighbor searches.
3. **Nearest Neighbor Search**: When a new query comes in, it's also converted into a vector using the same process. Then, the system performs a nearest neighbor search to find vectors that are closest to the query vector. The logic behind this is that semantically similar items will be closer in the vector space. The system uses measures such as cosine similarity or Euclidean distance to determine which vectors (and therefore which objects) are most similar to the query.
4. **Return Results**: The items associated with the nearest vectors are returned as the search results.

## Project Requirements

We will need several packages to implement sematic search in our Next.js app:

1. `pg`: the node.js Postgres library
2. `pg-hstore`: A node package for serializing and deserializing JSON data to hstore format
3. `pgvector`: a simple NPM package for handing the vector data type in `pg` and `sequelize`
4. `sequelize`: a fantastic ORM (Object Relational Mapping) package

The project is bootstrapped using `create-next-app@latest` with typescript, tailwind and app router.

## Step 1 - Create our ORM model and seed the database

First we need to define our Sequelize model. We'll start by creating a utility function to initialize Sequelize with the Postgres dialect:

```ts
// sequelize.ts
import { Sequelize } from 'sequelize';
import pg from 'pg';
import safe from 'colors';

const pgvector = require('pgvector/sequelize');
pgvector.registerType(Sequelize);

const logQuery = (query: string, options: any) => {
    console.log(safe.bgGreen(new Date().toLocaleString()));
    console.log(safe.bgYellow(options.bind));
    console.log(safe.bgBlue(query));
    return options;
}

const sequelize = new Sequelize(
    process.env.DB_NAME!, // DB name
    process.env.DB_USER!, // username
    process.env.DB_PASS!, // password
    {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT!, 5432),
        dialect: 'postgres',
        dialectModule: pg,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: process.env.NODE_ENV !== 'production' ? logQuery : false,
    }
);

export default sequelize;
```

Note that we are calling `registerType` from the `pgvector` package. This gives the `VECTOR` data type to our model which we will define next:

```ts
// Product.model.ts

import sequelize from "@/utils/sequelize";
import { createEmbedding } from "@/utils/openai";
const pgvector = require('pgvector/utils');

// Types
import { DataTypes, Model } from "sequelize";
import { T_Product } from "./products";

class Product extends Model implements T_Product {
    public id!: number;
    public name!: string;
    public slug!: string;
    public description!: string;
    public price!: number;
    public image!: string;
    public category!: string;
    public embedding!: number[];
    public createdAt!: Date;
    public updatedAt!: Date;

    public static async publicSearch(searchTerm: string, skip: number = 0, limit: number = 9999) {
        const embedding = await createEmbedding(searchTerm);
        const embSql = pgvector.toSql(embedding);
        const results = await Product.findAll({
            order: [
                sequelize.literal(`"embedding" <-> '${embSql}'`),
            ],
            offset: skip,
            limit: limit,
            attributes: {
                exclude: ['embedding']
            }
        });

        return results;
    }

    public static initModel(): void {

        Product.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            slug: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            price: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            image: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            category: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            embedding: {
                // @ts-ignore
                type: DataTypes.VECTOR(1536),
                allowNull: true,
                defaultValue: null
            }
        }, {
            sequelize,
            tableName: 'products',
            timestamps: true,
            paranoid: true,
            underscored: true,
        });
    }
}

Product.initModel();

Product.addHook('beforeCreate', async (product: Product) => {
    const input = product.name + '\n' + product.category + '\n' + product.description;
    const embedding = await createEmbedding(input);
    product.embedding = embedding;
    if (product.price) {
        product.price = parseInt(product.price.toString().replace('.', ''));
    }
});

Product.addHook('beforeUpdate', async (product: Product) => {
    const input = product.name + '\n' + product.category + '\n' + product.description;
    const embedding = await createEmbedding(input);
    product.embedding = embedding;
    if (product.changed('price')) {
        product.price = parseInt(product.price.toString().replace('.', ''));
    }
});

export default Product;
```

Here, we've established a unique column named 'embedding', which has a type of `VECTOR`. Subsequently, we design a method called `search` that takes our query and transforms it into an embedding vector. Utilizing the `toSql` helper function from `pgvector`, we formulate our query. Instead of applying a `where` clause, we sort the outcomes using the `<->` operator, an operator for comparing Euclidean distances. As a result, the results most pertinent semantically will appear first. We have the option to add pagination or limit the results, but our mock store contains only 20 products.

Additionally, we establish a `beforeCreate` and `beforeUpdate` hook that forms an embedding. We string together the product name, category, and description, and feed it into our OpenAI helper function, `createEmbedding`:

```ts
// openai.ts

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
```

In this approach, we employ the `openai` library to send a request to the `text-embedding-ada-002` model, which is considered the superior embeddings model at the time of this writing. The process is fairly quick, typically requiring less than a second.

Now let's write a script to seed our database. We will be using fakestoreapi.com to get our data:

```ts
import Product from "@/models/Products.model";
import { createSlug } from "./format";

const seedProducts = async (): Promise<void> => {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        const products = await response.json();

        const productsData = products.map((product: any) => ({
            name: product.title,
            slug: createSlug(product.title),
            description: product.description,
            price: parseInt(product.price.toString().replace('.', '')),
            image: product.image,
            category: product.category,
        }));
    
        
        await Product.sync({ alter: true });
        console.log('Product model synced!');

        await Product.destroy({
            where: {},
            force: true,
        });
        console.log('All products deleted!');

        for (const product of productsData) {
            await Product.create(product);
        }
        console.log('Products seeded!');
    } catch (err) {
        console.log(err);
    }
}


export default seedProducts;
```

This process will retrieve all 20 products from the mock store API. Afterward, it will initialize and/or empty our table, and then create a record for each product. Via our customized Sequelize hooks, an embedding will be automatically computed for each product!

And there you have it - quite straightforward! For the complete code of this sample project, you can check out the repository link provided below. Don't hesitate to clone it and give it a try!

## Resources

1. [GitHub Repo](https://github.com/designly1/next-vector-search-example)
2. [Demo Site](https://next-vector-search-example.vercel.app/)

---

Thank you for taking the time to read my article and I hope you found it useful (or at the very least, mildly entertaining). For more great information about web dev, systems administration and cloud computing, please read the [Designly Blog](https://blog.designly.biz). Also, please leave your comments! I love to hear thoughts from my readers.

I use [Hostinger](https://hostinger.com?REFERRALCODE=1J11864) to host my clients' websites. You can get a business account that can host 100 websites at a price of $3.99/mo, which you can lock in for up to 48 months! It's the best deal in town. Services include PHP hosting (with extensions), MySQL, Wordpress and Email services.

Looking for a web developer? I'm available for hire! To inquire, please fill out a [contact form](https://designly.biz/contact).