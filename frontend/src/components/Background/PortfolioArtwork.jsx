// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: PortfolioArtwork

const OrnamentPanelRef = OrnamentPanel;
const ornamentRows = [0, 72, 144, 216, 288, 360, 432, 504, 576];
const ornamentRowsRef = ornamentRows;
const ornamentColumns = [0, 72, 144];
const ornamentColumnsRef = ornamentColumns;

function OrnamentPanel() {
  return (
    <svg viewBox="0 0 180 648" fill="none" focusable="false">
      <path d="M18 0v648M54 0v648" className="portfolio-artwork-guide" />
      {ornamentRowsRef.flatMap((y, row) => ornamentColumnsRef.map((x) => (
        <g key={`${x}-${y}`} transform={`translate(${x - (row % 2) * 36} ${y})`} className="portfolio-artwork-line">
          <path d="M36 2L62.6 14.8L69.1 43.6L50.8 66.6L21.2 66.6L2.9 43.6L9.4 14.8Z" />
          <path d="M36 6L42.5 22.5L59.5 17.3L50.6 32.7L65.2 42.7L47.7 45.4L49 63L36 51L23 63L24.3 45.4L6.8 42.7L21.4 32.7L12.5 17.3L29.5 22.5Z" />
          <path d="M36 2L36 6M62.6 14.8L59.5 17.3M69.1 43.6L65.2 42.7M50.8 66.6L49 63M21.2 66.6L23 63M2.9 43.6L6.8 42.7M9.4 14.8L12.5 17.3" />
        </g>
      )))}
    </svg>
  );
}

export function PortfolioArtwork() {
  return (
    <div className="portfolio-artwork" aria-hidden="true">
      <div className="portfolio-artwork-orbit" data-artwork-depth="8">
        <div className="portfolio-artwork-float"><OrnamentPanelRef /></div>
      </div>
      <div className="portfolio-artwork-structure" data-artwork-depth="-8">
        <div className="portfolio-artwork-float"><OrnamentPanelRef /></div>
      </div>
    </div>
  );
}
// codeguard:components:end
