import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const ExportPage = () => {
  const [loading, setLoading] = useState(true);
  const [exportData, setExportData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get data from localStorage
        const storedBids = JSON.parse(localStorage.getItem('txbids-projects') || '[]');
        
        if (storedBids.length === 0) {
          setError('No bid data available to export. Please upload bid files first.');
          setLoading(false);
          return;
        }

        // Send to API for processing
        const response = await fetch('/api/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bids: storedBids }),
        });

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to export data');
        }
        
        setExportData(result.data);
      } catch (err) {
        console.error('Error exporting data:', err);
        setError(err.message || 'An error occurred while exporting data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const handleCopyToClipboard = () => {
    if (exportData) {
      navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleDownload = () => {
    if (exportData) {
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `txbids-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Head>
        <title>Export Bid Data | TxBids</title>
      </Head>

      <div className="mb-6 flex justify-between items-center">
        <Link href="/">
          <span className="text-blue-500 hover:text-blue-700">
            &larr; Back to Dashboard
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-center flex-grow">
          Export Bid Data
        </h1>
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="mb-4">{error}</p>
          <Link href="/">
            <span className="inline-block bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded">
              Return to Dashboard
            </span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Data Summary</h2>
              <div className="space-x-2">
                <button 
                  onClick={handleCopyToClipboard}
                  className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition"
                >
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
                <button 
                  onClick={handleDownload}
                  className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded transition"
                >
                  Download JSON
                </button>
              </div>
            </div>
            
            {exportData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-lg mb-3">Projects</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li><span className="font-semibold">Total Projects:</span> {exportData.totalProjects}</li>
                    <li><span className="font-semibold">Total Counties:</span> {exportData.statistics.countiesCovered.length}</li>
                    <li><span className="font-semibold">Project Types:</span> {exportData.statistics.projectTypes.length}</li>
                    <li><span className="font-semibold">Total Bidders:</span> {exportData.statistics.totalBidders}</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-3">Financial Overview</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>
                      <span className="font-semibold">Total Engineer Estimate:</span> 
                      ${exportData.statistics.totalEstimateValue.toLocaleString(undefined, {maximumFractionDigits: 2})}
                    </li>
                    <li>
                      <span className="font-semibold">Total Lowest Bids:</span> 
                      ${exportData.statistics.totalBidValue.toLocaleString(undefined, {maximumFractionDigits: 2})}
                    </li>
                    <li>
                      <span className="font-semibold">Average Difference:</span> 
                      {exportData.statistics.avgDiffFromEstimate.toFixed(2)}%
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          {exportData && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Top Bidders</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bidder</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bids</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Bid</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {exportData.statistics.bidderStats.slice(0, 10).map((bidder, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{bidder.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{bidder.bidCount}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{bidder.winCount}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {((bidder.winCount / bidder.bidCount) * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          ${bidder.avgBidAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {exportData && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">JSON Preview</h2>
              <div className="bg-gray-50 p-4 rounded overflow-auto max-h-96">
                <pre className="text-xs text-gray-700">
                  {JSON.stringify(exportData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExportPage;