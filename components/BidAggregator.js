import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';

const BidAggregator = () => {
  const router = useRouter();
  const [bids, setBids] = useState([]);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({
    county: '',
    projectType: '',
    contractNumber: '',
    bidderName: ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // This ensures we only run client-side code after hydration
  useEffect(() => {
    setIsClient(true);
    
    // Load saved bids from localStorage
    try {
      const savedBids = JSON.parse(localStorage.getItem('txbids-projects') || '[]');
      if (savedBids.length > 0) {
        setBids(savedBids);
      }
    } catch (error) {
      console.error('Error loading saved bids:', error);
    }
  }, []);

  // Save bids to localStorage whenever they change
  useEffect(() => {
    if (bids.length > 0) {
      try {
        localStorage.setItem('txbids-projects', JSON.stringify(bids));
      } catch (error) {
        console.error('Error saving bids to localStorage:', error);
      }
    }
  }, [bids]);

  // Handle file drop
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const newBids = [];
    
    for (const file of files) {
      if (!file.name.endsWith('.TXT')) continue;
      
      try {
        const content = await readFileAsText(file);
        const parsedBid = parseBidFile(content, file.name);
        if (parsedBid) {
          newBids.push(parsedBid);
        }
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      }
    }
    
    setBids(prevBids => [...prevBids, ...newBids]);
  }, []);
  
  // File reading utility function
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };
  
  // Parse bid file content
  const parseBidFile = (content, filename) => {
    const lines = content.split('\n');
    
    // Extract county
    const countyLine = lines.find(line => line.includes('COUNTY'));
    const county = countyLine ? countyLine.split(/\s+/)[1] : 'Unknown';
    
    // Extract project type
    const typeLine = lines.find(line => line.includes('TYPE'));
    const projectType = typeLine ? typeLine.trim().replace(/^TYPE\s+/, '') : 'Unknown';
    
    // Extract date
    const dateLine = lines.find(line => line.includes('DATE'));
    let date = 'Unknown';
    if (dateLine) {
      const dateMatch = dateLine.match(/DATE\s+(\d{2})\/(\d{2})\/(\d{2})/);
      if (dateMatch) {
        date = `20${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}`;
      }
    }
    
    // Extract contract number
    const contractLine = lines.find(line => line.includes('CONTRACT NUMBER'));
    const contractNumber = contractLine ? contractLine.trim().split(/\s+/).pop() : 'Unknown';
    
    // Extract engineer estimate
    const estimateLine = lines.find(line => line.includes('*****ESTIMATE*****'));
    let engineerEstimate = 0;
    if (estimateLine) {
      const estimateMatch = estimateLine.match(/\$([0-9,]+\.\d{2})/);
      if (estimateMatch) {
        engineerEstimate = parseFloat(estimateMatch[1].replace(/,/g, ''));
      }
    }
    
    // Extract bidders
    const bidders = [];
    const bidderLines = lines.filter(line => 
      line.trim().startsWith('BIDDER ') && line.includes('$')
    );
    
    for (const line of bidderLines) {
      const parts = line.trim().split(/\s+/);
      const bidderIndex = parts.findIndex(part => part.startsWith('$')) || 0;
      
      if (bidderIndex > 0) {
        const bidderNumber = parts[0].replace('BIDDER', '') + parts[1];
        const bidAmount = parseFloat(parts[bidderIndex].replace(/[\$,]/g, ''));
        const bidderName = parts.slice(bidderIndex + 1).join(' ');
        
        bidders.push({
          number: bidderNumber,
          amount: bidAmount,
          name: bidderName
        });
      }
    }
    
    // Calculate lowest bid
    let lowestBid = bidders.length > 0 
      ? Math.min(...bidders.map(b => b.amount)) 
      : 0;
      
    // Calculate difference from estimate
    const diffFromEstimate = engineerEstimate > 0
      ? ((lowestBid - engineerEstimate) / engineerEstimate * 100).toFixed(2)
      : 0;
    
    return {
      id: `${filename}-${Date.now()}`,
      filename,
      county,
      projectType,
      date,
      contractNumber,
      engineerEstimate,
      bidders,
      lowestBid,
      diffFromEstimate
    };
  };
  
  // Handle drag events
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Handle sort change
  const handleSortChange = useCallback((field) => {
    setSortField(field);
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortDirection('asc');
    }
  }, [sortField]);
  
  // Handle filter change
  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      county: '',
      projectType: '',
      contractNumber: '',
      bidderName: ''
    });
  }, []);
  
  // Clear all data
  const clearData = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all data?')) {
      setBids([]);
      localStorage.removeItem('txbids-projects');
    }
  }, []);
  
  // Handle row click to navigate to project detail
  const handleRowClick = useCallback((bid) => {
    router.push(`/project/${bid.id}`);
  }, [router]);
  
  // Filter and sort the bids
  const filteredAndSortedBids = useMemo(() => {
    // First apply filters
    let result = [...bids];
    
    if (filters.county) {
      result = result.filter(bid => 
        bid.county.toLowerCase().includes(filters.county.toLowerCase())
      );
    }
    
    if (filters.projectType) {
      result = result.filter(bid => 
        bid.projectType.toLowerCase().includes(filters.projectType.toLowerCase())
      );
    }
    
    if (filters.contractNumber) {
      result = result.filter(bid => 
        bid.contractNumber.includes(filters.contractNumber)
      );
    }
    
    if (filters.bidderName) {
      result = result.filter(bid => 
        bid.bidders.some(bidder => 
          bidder.name.toLowerCase().includes(filters.bidderName.toLowerCase())
        )
      );
    }
    
    // Then sort
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Special handling for numeric fields
      if (['engineerEstimate', 'lowestBid', 'diffFromEstimate'].includes(sortField)) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      // Date field special handling
      if (sortField === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      // Sort direction
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction * aValue.localeCompare(bValue);
      }
      
      // Handle other types
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });
    
    return result;
  }, [bids, filters, sortField, sortDirection]);
  
  // Get unique counties for filter dropdown
  const uniqueCounties = useMemo(() => {
    return [...new Set(bids.map(bid => bid.county))].sort();
  }, [bids]);
  
  // Get unique project types for filter dropdown
  const uniqueProjectTypes = useMemo(() => {
    return [...new Set(bids.map(bid => bid.projectType))].sort();
  }, [bids]);

  if (!isClient) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Texas Department of Transportation Bid Aggregator
      </h1>
      
      {/* File drop zone */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-gray-500 mb-2">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Drag and drop Texas EBS bid files (.TXT) here
        </div>
        <p className="text-sm text-gray-400">
          Files will be processed and added to the table below
        </p>
      </div>
      
      {/* Controls and filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-3 justify-between items-end">
          <div>
            <h2 className="text-lg font-medium mb-2">Filters</h2>
            <div className="flex flex-wrap gap-2">
              <div>
                <label className="block text-sm mb-1">County</label>
                <select 
                  className="p-2 border rounded w-40"
                  value={filters.county}
                  onChange={(e) => handleFilterChange('county', e.target.value)}
                >
                  <option value="">All Counties</option>
                  {uniqueCounties.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Project Type</label>
                <select 
                  className="p-2 border rounded w-52"
                  value={filters.projectType}
                  onChange={(e) => handleFilterChange('projectType', e.target.value)}
                >
                  <option value="">All Project Types</option>
                  {uniqueProjectTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Contract #</label>
                <input 
                  type="text" 
                  className="p-2 border rounded w-32"
                  value={filters.contractNumber}
                  onChange={(e) => handleFilterChange('contractNumber', e.target.value)}
                  placeholder="Search..."
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Bidder Name</label>
                <input 
                  type="text" 
                  className="p-2 border rounded w-48"
                  value={filters.bidderName}
                  onChange={(e) => handleFilterChange('bidderName', e.target.value)}
                  placeholder="Search bidders..."
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
            <button 
              className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded"
              onClick={clearData}
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>
      
      {/* Results table */}
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">
          Bid Results {bids.length > 0 ? `(${filteredAndSortedBids.length} of ${bids.length})` : ''}
        </h2>
        
        {bids.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No bid data to display. Drop TxDOT bid files to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('date')}
                  >
                    Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('county')}
                  >
                    County {sortField === 'county' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('projectType')}
                  >
                    Project Type {sortField === 'projectType' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('contractNumber')}
                  >
                    Contract # {sortField === 'contractNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('engineerEstimate')}
                  >
                    Engineer Est. {sortField === 'engineerEstimate' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bidders
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('lowestBid')}
                  >
                    Lowest Bid {sortField === 'lowestBid' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('diffFromEstimate')}
                  >
                    % Diff {sortField === 'diffFromEstimate' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedBids.map((bid) => (
                  <tr 
                    key={bid.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(bid)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bid.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bid.county}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bid.projectType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bid.contractNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${bid.engineerEstimate.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-h-32 overflow-y-auto">
                        {bid.bidders.map((bidder, idx) => (
                          <div key={idx} className={`mb-1 ${bidder.amount === bid.lowestBid ? 'font-semibold' : ''}`}>
                            {bidder.name}: ${bidder.amount.toLocaleString()}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${bid.lowestBid.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      parseFloat(bid.diffFromEstimate) < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {bid.diffFromEstimate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Statistics and summary */}
      {bids.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-1">Total Projects</h3>
            <p className="text-2xl font-bold">{bids.length}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 mb-1">Avg Engineer Estimate</h3>
            <p className="text-2xl font-bold">
              ${(bids.reduce((sum, bid) => sum + bid.engineerEstimate, 0) / bids.length).toLocaleString(undefined, {maximumFractionDigits: 2})}
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-800 mb-1">Avg % Difference</h3>
            <p className="text-2xl font-bold">
              {(bids.reduce((sum, bid) => sum + parseFloat(bid.diffFromEstimate), 0) / bids.length).toFixed(2)}%
            </p>
          </div>
        </div>
      )}
      
      <footer className="text-center text-gray-500 text-sm mt-8">
        Texas Department of Transportation Bid Aggregator Tool
      </footer>
    </div>
  );
};

export default BidAggregator;