export interface CSVPlace {
    id: string;
    name: string;
    address: string;
    latitude: string | null;
    longitude: string | null;
    category: string | null;
    cuisine: string | null;
    price: string | null;
    rating: string | null;
    status: string | null;
    website: string | null;
    phone: string | null;
    opening_hours: string | null;
}

export interface Place {
    name: string;
    address: string;
    category: string;
    cuisine?: string;
    price: 1 | 2 | 3 | 4;
    rating: number;
    sentiment: number;
    imageUrl?: string;
    latitude: number;
    longitude: number;
}

export function parseCSVRow(row: string): CSVPlace | null {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);

    if (values.length < 2) return null;

    return {
        id: values[0]?.replace(/^"|"$/g, '') || '',
        name: values[3]?.replace(/^"|"$/g, '') || '',
        address: values[6]?.replace(/^"|"$/g, '') || '',
        latitude: values[14]?.replace(/^"|"$/g, '') || null,
        longitude: values[15]?.replace(/^"|"$/g, '') || null,
        category: values[18]?.replace(/^"|"$/g, '') || null,
        cuisine: values[20]?.replace(/^"|"$/g, '') || null,
        price: values[43]?.replace(/^"|"$/g, '') || null,
        rating: values[44]?.replace(/^"|"$/g, '') || null,
        status: values[17]?.replace(/^"|"$/g, '') || null,
        website: values[31]?.replace(/^"|"$/g, '') || null,
        phone: values[32]?.replace(/^"|"$/g, '') || null,
        opening_hours: values[33]?.replace(/^"|"$/g, '') || null,
    };
}

export function convertCSVToPlace(csvPlace: CSVPlace): Place | null {
    const lat = csvPlace.latitude ? parseFloat(csvPlace.latitude) : null;
    const lng = csvPlace.longitude ? parseFloat(csvPlace.longitude) : null;

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        return null;
    }

    const rating = csvPlace.rating ? parseFloat(csvPlace.rating) : 0;
    const priceStr = csvPlace.price?.replace(/\$/g, '') || '';
    let price: 1 | 2 | 3 | 4 = 2;

    if (priceStr.includes('$$$$')) price = 4;
    else if (priceStr.includes('$$$')) price = 3;
    else if (priceStr.includes('$$')) price = 2;
    else if (priceStr.includes('$')) price = 1;

    const category = csvPlace.category || 'Restaurant';
    const cuisine = csvPlace.cuisine || undefined;

    const sentiment = rating > 0 ? Math.round((rating / 5) * 100) : 70;

    const imageUrl = `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&sig=${csvPlace.id}`;

    return {
        name: csvPlace.name,
        address: csvPlace.address,
        category,
        cuisine,
        price,
        rating: rating || 4.0,
        sentiment,
        imageUrl,
        latitude: lat,
        longitude: lng,
    };
}

