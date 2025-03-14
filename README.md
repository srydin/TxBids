# TxBids - Texas Department of Transportation Bid Aggregator

A React application for analyzing and comparing TxDOT Electronic Bidding System (EBS) files.

## Features

- Drag and drop interface for easy file upload
- Automatic parsing of TxDOT bid files
- Sortable and filterable data table
- Visual comparison of engineer estimates vs actual bids
- Statistics on bid data

## How to Use

1. Clone this repository
2. Install dependencies with `npm install`
3. Start the development server with `npm start`
4. Drag and drop TxDOT .TXT bid files into the application

## Data Extracted

The application extracts the following data from TxDOT bid files:

- County and project location
- Project type and description
- Contract numbers and dates
- Engineer's estimates
- All bidders and their bid amounts
- Automatic calculation of lowest bids
- Percentage difference between lowest bids and engineer estimates

## Technologies Used

- React
- Tailwind CSS

## License

MIT
