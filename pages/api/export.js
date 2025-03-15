// API route to export all bid data and summary statistics

export default function handler(req, res) {
  try {
    // We can't access localStorage server-side, so we need to inform the client
    if (req.method === 'GET') {
      res.status(200).json({ 
        message: "This endpoint must be called via client-side code due to localStorage restrictions.",
        success: false 
      });
    } else if (req.method === 'POST') {
      // Accept posted data from client and process it
      const { bids } = req.body;
      
      if (!bids || !Array.isArray(bids)) {
        return res.status(400).json({ 
          message: "Invalid data format. Expected an array of bid objects.", 
          success: false 
        });
      }
      
      // Calculate summary statistics
      const stats = calculateSummaryStats(bids);
      
      // Return both the raw data and the calculated statistics
      res.status(200).json({
        success: true,
        data: {
          bids: bids,
          statistics: stats,
          exportedAt: new Date().toISOString(),
          totalProjects: bids.length
        }
      });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed`, success: false });
    }
  } catch (error) {
    console.error('Error in export API:', error);
    res.status(500).json({ message: 'Internal Server Error', success: false, error: error.message });
  }
}

// Calculate summary statistics from bid data
function calculateSummaryStats(bids) {
  if (!bids || bids.length === 0) {
    return {
      avgEngineerEstimate: 0,
      avgLowestBid: 0,
      avgDiffFromEstimate: 0,
      totalEstimateValue: 0,
      totalBidValue: 0,
      totalBidders: 0,
      countiesCovered: [],
      projectTypes: [],
      bidderStats: []
    };
  }
  
  // Basic statistics
  const totalEstimateValue = bids.reduce((sum, bid) => sum + bid.engineerEstimate, 0);
  const totalBidValue = bids.reduce((sum, bid) => sum + bid.lowestBid, 0);
  const avgEngineerEstimate = totalEstimateValue / bids.length;
  const avgLowestBid = totalBidValue / bids.length;
  const avgDiffFromEstimate = bids.reduce((sum, bid) => sum + parseFloat(bid.diffFromEstimate), 0) / bids.length;
  
  // Get unique counties and project types
  const countiesCovered = [...new Set(bids.map(bid => bid.county))].sort();
  const projectTypes = [...new Set(bids.map(bid => bid.projectType))].sort();
  
  // Calculate bidder statistics
  const bidderMap = new Map();
  let totalBidders = 0;
  
  bids.forEach(bid => {
    totalBidders += bid.bidders.length;
    
    bid.bidders.forEach(bidder => {
      if (!bidderMap.has(bidder.name)) {
        bidderMap.set(bidder.name, {
          name: bidder.name,
          bidCount: 0,
          winCount: 0,
          totalBidAmount: 0,
          avgBidAmount: 0
        });
      }
      
      const bidderStats = bidderMap.get(bidder.name);
      bidderStats.bidCount += 1;
      bidderStats.totalBidAmount += bidder.amount;
      
      if (bidder.amount === bid.lowestBid) {
        bidderStats.winCount += 1;
      }
      
      bidderStats.avgBidAmount = bidderStats.totalBidAmount / bidderStats.bidCount;
      bidderMap.set(bidder.name, bidderStats);
    });
  });
  
  // Convert map to array and sort by win count
  const bidderStats = Array.from(bidderMap.values())
    .sort((a, b) => b.winCount - a.winCount || b.bidCount - a.bidCount);
  
  // Return the calculated statistics
  return {
    avgEngineerEstimate,
    avgLowestBid,
    avgDiffFromEstimate,
    totalEstimateValue,
    totalBidValue,
    totalBidders,
    countiesCovered,
    projectTypes,
    bidderStats
  };
}