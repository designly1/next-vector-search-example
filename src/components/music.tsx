'use client'
import React from 'react'
import Embed from 'react-embed'

export default function Music() {
    return (
        <>
            <h2 className="text-2xl font-bold">Also, for your listening enjoyment!</h2>
            <Embed url="https://soundcloud.com/jaysudo1/depend-on" />
            <Embed url="https://soundcloud.com/jaysudo1/phantasy" />
        </>
    )
}
