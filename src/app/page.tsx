'use client';

import Head from 'next/head';
import FloorPlan from '../components/FloorPlan';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  return (
    <>
      <Head>
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" 
        />
      </Head>
      <main>
        <FloorPlan />
      </main>
    </>
  );
}