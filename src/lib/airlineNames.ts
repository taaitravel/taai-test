// Airline code to full name mapping
export const airlineNames: Record<string, string> = {
  // US Airlines
  'AA': 'American Airlines',
  'DL': 'Delta Air Lines',
  'UA': 'United Airlines',
  'WN': 'Southwest Airlines',
  'B6': 'JetBlue Airways',
  'AS': 'Alaska Airlines',
  'F9': 'Frontier Airlines',
  'NK': 'Spirit Airlines',
  'G4': 'Allegiant Air',
  'SY': 'Sun Country Airlines',
  
  // International Airlines
  'AC': 'Air Canada',
  'BA': 'British Airways',
  'LH': 'Lufthansa',
  'AF': 'Air France',
  'KL': 'KLM',
  'LX': 'Swiss International Air Lines',
  'OS': 'Austrian Airlines',
  'SN': 'Brussels Airlines',
  'TP': 'TAP Air Portugal',
  'IB': 'Iberia',
  'AZ': 'ITA Airways',
  'SK': 'SAS Scandinavian Airlines',
  'AY': 'Finnair',
  'LO': 'LOT Polish Airlines',
  
  // Asian Airlines
  'NH': 'All Nippon Airways',
  'JL': 'Japan Airlines',
  'KE': 'Korean Air',
  'OZ': 'Asiana Airlines',
  'SQ': 'Singapore Airlines',
  'TG': 'Thai Airways',
  'CX': 'Cathay Pacific',
  'BR': 'EVA Air',
  'CI': 'China Airlines',
  'CA': 'Air China',
  'MU': 'China Eastern Airlines',
  'CZ': 'China Southern Airlines',
  
  // Middle East Airlines
  'EK': 'Emirates',
  'QR': 'Qatar Airways',
  'EY': 'Etihad Airways',
  'TK': 'Turkish Airlines',
  'MS': 'EgyptAir',
  'GF': 'Gulf Air',
  'SV': 'Saudia',
  
  // Latin American Airlines
  'AM': 'Aeroméxico',
  'LA': 'LATAM Airlines',
  'AV': 'Avianca',
  'CM': 'Copa Airlines',
  'AR': 'Aerolíneas Argentinas',
  'G3': 'Gol Linhas Aéreas',
  
  // Australian Airlines
  'QF': 'Qantas',
  'VA': 'Virgin Australia',
  'NZ': 'Air New Zealand',
  
  // Budget/Low-Cost Carriers
  'FR': 'Ryanair',
  'U2': 'easyJet',
  'VY': 'Vueling',
  'W6': 'Wizz Air',
  'LS': 'Jet2.com',
  'TO': 'Transavia',
  'PC': 'Pegasus Airlines',
  'FZ': 'flydubai',
  'WY': 'Oman Air',
};

export const getAirlineName = (code: string): string => {
  return airlineNames[code.toUpperCase()] || code;
};
