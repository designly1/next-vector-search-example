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
                allowNull: true,
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
