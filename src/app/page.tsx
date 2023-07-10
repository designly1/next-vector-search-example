import Image from 'next/image'
import Link from 'next/link';
import Search from '@/components/search';

import githubIcon from '@/img/github.svg'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24 gap-10">
      <Link className="angled-div" href="https://github.com" target="_blank">
        <div>
          <Image
            src={githubIcon}
            alt="Github Icon"
            width={60}
            height={60}
          />
        </div>
      </Link>
      <h1 className="text-4xl font-bold">Welcome to The Fake Store!</h1>
      <Search />
    </main>
  )
}
