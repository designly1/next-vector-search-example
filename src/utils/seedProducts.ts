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