'use client'
import React, { useState } from 'react'
import { T_Product } from '@/models/products';
import Turnstile from 'react-hook-turnstile';

export default function Search() {
    const [search, setSearch] = useState<string>('');
    const [results, setResults] = useState<T_Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState<string>('');

    const handleSearch = async () => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                body: JSON.stringify({ query: search, token })
            });
            if (!response.ok) throw new Error(response.statusText);
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }

    return (
        <>
            <div className="flex flex-col items-center gap-2">
                <h2>Suggested search terms:</h2>
                <div className="flex gap-4 text-primary">
                    <p>Hard drive</p>
                    <p>Men&apos;s jacket</p>
                    <p>Women&apos;s jacket</p>
                </div>
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    className="input input-bordered w-full max-w-md"
                    placeholder="Search for products..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={e => e.target.select()}
                />
                <button
                    className="btn btn-primary w-28"
                    onClick={handleSearch}
                    disabled={isLoading}
                >{
                        isLoading
                            ?
                            <>
                                <span className="loading loading-ring"></span>
                            </>
                            :
                            <>Search</>

                    }</button>
            </div>
            {
                !isLoading
                    ?
                    <Turnstile
                        sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                        onVerify={(t) => setToken(t)}
                    />
                    : null
            }
            {
                results.length > 0
                    ?
                    <div className="grid grid-cols-1 lg:grid-cols-3 w-full max-w-5xl gap-6">
                        {results.map((product, index) => (
                            <div key={index} className="card bordered shadow-lg">
                                <figure>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={product.image} alt={product.name} />
                                </figure>
                                <div className="card-body bg-gray-100">
                                    <h2 className="card-title">{product.name}</h2>
                                    <p className="text-gray-700 text-sm">{product.description}</p>
                                    <div className="card-actions mt-4">
                                        <button className="btn btn-secondary">Add to cart</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    : null
            }
        </>
    )
}
