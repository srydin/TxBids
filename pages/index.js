import BidAggregator from '../components/BidAggregator';
import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>TxBids - Texas DOT Bid Aggregator</title>
        <meta name="description" content="Texas Department of Transportation Bid Aggregator" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <BidAggregator />
      </main>
    </div>
  );
}
