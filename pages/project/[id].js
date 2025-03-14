import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const ProjectDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    // Try to retrieve project data from localStorage
    try {
      const storedProjects = JSON.parse(localStorage.getItem('txbids-projects') || '[]');
      const foundProject = storedProjects.find(p => p.id === id);
      
      if (foundProject) {
        setProject(foundProject);
      }
    } catch (error) {
      console.error('Error retrieving project data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded-lg text-center">
          <h2 className="text-xl font-bold mb-2">Project Not Found</h2>
          <p className="mb-4">The requested project could not be found or has been removed.</p>
          <Link href="/">
            <span className="inline-block bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded">
              Return to Dashboard
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate bid statistics
  const bidCount = project.bidders.length;
  const averageBid = project.bidders.reduce((sum, bidder) => sum + bidder.amount, 0) / bidCount;
  const medianBid = project.bidders.length > 0 
    ? [...project.bidders].sort((a, b) => a.amount - b.amount)[Math.floor(bidders.length / 2)].amount 
    : 0;
  const bidRange = bidCount > 1 
    ? Math.max(...project.bidders.map(b => b.amount)) - Math.min(...project.bidders.map(b => b.amount))
    : 0;
  const bidDispersion = bidCount > 1 
    ? (bidRange / averageBid * 100).toFixed(2)
    : 0;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Head>
        <title>{project.projectType} in {project.county} | TxBids</title>
      </Head>

      <div className="mb-4 flex justify-between items-center">
        <Link href="/">
          <span className="text-blue-500 hover:text-blue-700">
            &larr; Back to All Projects
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-center flex-grow">
          Project Details
        </h1>
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>

      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-xl font-bold mb-4">{project.projectType}</h2>
            <p className="text-gray-700 mb-2"><span className="font-semibold">County:</span> {project.county}</p>
            <p className="text-gray-700 mb-2"><span className="font-semibold">Date:</span> {project.date}</p>
            <p className="text-gray-700 mb-2"><span className="font-semibold">Contract Number:</span> {project.contractNumber}</p>
            <p className="text-gray-700"><span className="font-semibold">File:</span> {project.filename}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Bid Summary</h3>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Engineer Estimate:</span> ${project.engineerEstimate.toLocaleString()}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Lowest Bid:</span> ${project.lowestBid.toLocaleString()}
            </p>
            <p className={`font-semibold ${parseFloat(project.diffFromEstimate) < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {parseFloat(project.diffFromEstimate) < 0 ? 'Under' : 'Over'} estimate by {Math.abs(parseFloat(project.diffFromEstimate))}%
            </p>
          </div>
        </div>
      </div>

      {/* Bid Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">Bid Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700 mb-1">Number of Bidders</p>
            <p className="text-2xl font-bold">{bidCount}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700 mb-1">Average Bid</p>
            <p className="text-2xl font-bold">${averageBid.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-700 mb-1">Bid Range</p>
            <p className="text-2xl font-bold">${bidRange.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-700 mb-1">Bid Dispersion</p>
            <p className="text-2xl font-bold">{bidDispersion}%</p>
          </div>
        </div>
      </div>

      {/* Bidder Comparison */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">Bidder Comparison</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bidder</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bid Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diff. from Lowest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diff. from Estimate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...project.bidders]
                .sort((a, b) => a.amount - b.amount)
                .map((bidder, index) => {
                  const diffFromLowest = ((bidder.amount - project.lowestBid) / project.lowestBid * 100).toFixed(2);
                  const diffFromEstimate = ((bidder.amount - project.engineerEstimate) / project.engineerEstimate * 100).toFixed(2);
                  
                  return (
                    <tr key={index} className={bidder.amount === project.lowestBid ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bidder.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${bidder.amount.toLocaleString()}
                        {bidder.amount === project.lowestBid && (
                          <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Lowest</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bidder.amount === project.lowestBid ? (
                          '-'
                        ) : (
                          <span className="text-red-600">+{diffFromLowest}%</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={parseFloat(diffFromEstimate) < 0 ? 'text-green-600' : 'text-red-600'}>
                          {parseFloat(diffFromEstimate) < 0 ? '' : '+'}{diffFromEstimate}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualization */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">Bid Visualization</h3>
        <div className="h-64 relative border border-gray-200 rounded-lg p-4">
          {project.bidders.length > 0 && (
            <div className="flex h-full items-end">
              {/* Engineer Estimate Bar */}
              <div 
                className="relative mx-2 w-12 bg-gray-300 rounded-t-sm"
                style={{
                  height: `${(project.engineerEstimate / Math.max(...project.bidders.map(b => b.amount), project.engineerEstimate) * 100)}%`
                }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap">
                  Est.
                </div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs">
                  ${(project.engineerEstimate / 1000).toFixed(0)}k
                </div>
              </div>
              
              {/* Bidder Bars */}
              {[...project.bidders]
                .sort((a, b) => a.amount - b.amount)
                .map((bidder, index) => {
                  const maxAmount = Math.max(...project.bidders.map(b => b.amount), project.engineerEstimate);
                  const height = (bidder.amount / maxAmount * 100);
                  
                  return (
                    <div 
                      key={index} 
                      className={`relative mx-2 w-12 rounded-t-sm ${bidder.amount === project.lowestBid ? 'bg-green-500' : 'bg-blue-400'}`}
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap overflow-hidden max-w-xs">
                        {bidder.name.split(' ')[0]}
                      </div>
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs">
                        ${(bidder.amount / 1000).toFixed(0)}k
                      </div>
                    </div>
                  );
                })
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;