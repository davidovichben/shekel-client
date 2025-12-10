/**
 * Utility functions for Hebrew date conversion
 */

const HEBREW_NUMERALS = [
  '', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט',
  'י', 'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט',
  'כ', 'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט',
  'ל'
];

const HEBREW_HUNDREDS: Record<number, string> = {
  100: 'ק',
  200: 'ר',
  300: 'ש',
  400: 'ת',
  500: 'תק',
  600: 'תר',
  700: 'תש',
  800: 'תת',
  900: 'תתק'
};

/**
 * Converts a Gregorian date string to Hebrew date format
 * @param dateString - Date string in format DD/MM/YYYY or YYYY-MM-DD
 * @returns Hebrew date string in format "כה' שבט תשע'ז"
 */
export function convertToHebrewDate(dateString: string | null | undefined): string {
  if (!dateString) return '--';

  try {
    // Parse the date string
    let date: Date;
    
    // Handle DD/MM/YYYY format
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        date = new Date(year, month, day);
      } else {
        return dateString; // Return as-is if can't parse
      }
    } 
    // Handle YYYY-MM-DD format
    else if (dateString.includes('-')) {
      date = new Date(dateString);
    } 
    // Try parsing as-is
    else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if invalid date
    }

    // Use Intl.DateTimeFormat to get Hebrew calendar date
    const hebrewFormatter = new Intl.DateTimeFormat('en-US-u-ca-hebrew', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const parts = hebrewFormatter.formatToParts(date);
    
    let day = '';
    let month = '';
    let year = '';

    for (const part of parts) {
      if (part.type === 'day') {
        day = part.value;
      } else if (part.type === 'month') {
        month = part.value;
      } else if (part.type === 'year') {
        year = part.value;
      }
    }

    // Convert to Hebrew format
    const dayNum = parseInt(day, 10);
    const dayHebrew = HEBREW_NUMERALS[dayNum] || day;
    
    // Map English month names to Hebrew
    const monthHebrew = getHebrewMonthName(month);
    
    // Convert year to Hebrew numerals
    const yearNum = parseInt(year, 10);
    const yearHebrew = convertYearToHebrew(yearNum);

    // Format: "day month|year" - we'll split by | in the component
    // Day and month on top, year on bottom
    return `${dayHebrew}' ${monthHebrew}|${yearHebrew}`;
  } catch (error) {
    console.error('Error converting to Hebrew date:', error);
    return dateString; // Return original if conversion fails
  }
}

/**
 * Maps English Hebrew month names to Hebrew
 */
function getHebrewMonthName(englishMonth: string): string {
  const monthMap: Record<string, string> = {
    'Nisan': 'ניסן',
    'Iyyar': 'אייר',
    'Sivan': 'סיוון',
    'Tammuz': 'תמוז',
    'Av': 'אב',
    'Elul': 'אלול',
    'Tishrei': 'תשרי',
    'Marcheshvan': 'חשוון',
    'Kislev': 'כסלו',
    'Tevet': 'טבת',
    'Shevat': 'שבט',
    'Adar': 'אדר',
    'Adar I': 'אדר א',
    'Adar II': 'אדר ב'
  };

  return monthMap[englishMonth] || englishMonth;
}

/**
 * Converts year number to Hebrew format (e.g., 5777 -> תשע'ז)
 */
function convertYearToHebrew(year: number): string {
  if (year < 1000) {
    // For years less than 1000, convert directly
    return convertNumberToHebrew(year);
  }
  
  // For Hebrew years (typically 5000+), show last 3 digits
  // Example: 5777 -> 777 -> תשע'ז
  const lastThree = year % 1000;
  return convertNumberToHebrew(lastThree);
}

/**
 * Converts a number (1-999) to Hebrew numerals
 */
function convertNumberToHebrew(num: number): string {
  if (num === 0) return '';
  if (num > 999) num = num % 1000;
  
  let result = '';
  
  // Hundreds (100-900)
  const hundreds = Math.floor(num / 100) * 100;
  if (hundreds > 0) {
    result += HEBREW_HUNDREDS[hundreds] || '';
  }
  
  // Tens and ones (1-99)
  const remainder = num % 100;
  if (remainder > 0) {
    if (remainder <= 30) {
      result += HEBREW_NUMERALS[remainder] || '';
    } else {
      // For numbers > 30, combine tens and ones
      const tens = Math.floor(remainder / 10) * 10;
      const ones = remainder % 10;
      
      if (tens === 30) {
        result += 'ל';
      } else if (tens === 40) {
        result += 'מ';
      } else if (tens === 50) {
        result += 'נ';
      } else if (tens === 60) {
        result += 'ס';
      } else if (tens === 70) {
        result += 'ע';
      } else if (tens === 80) {
        result += 'פ';
      } else if (tens === 90) {
        result += 'צ';
      }
      
      if (ones > 0) {
        result += HEBREW_NUMERALS[ones];
      }
    }
  }
  
  return result ? `${result}'` : num.toString();
}

