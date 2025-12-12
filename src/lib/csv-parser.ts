export interface CSVPlace {
    id: string;
    name: string;
    address: string;
    city: string | null;
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
    city?: string;
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

    if (values.length < 15) return null;

    return {
        id: values[0]?.replace(/^"|"$/g, '').trim() || '',
        name: values[1]?.replace(/^"|"$/g, '').trim() || '',
        address: values[4]?.replace(/^"|"$/g, '').trim() || '',
        city: values[10]?.replace(/^"|"$/g, '').trim() || null,
        latitude: values[13]?.replace(/^"|"$/g, '').trim() || null,
        longitude: values[14]?.replace(/^"|"$/g, '').trim() || null,
        category: values[16]?.replace(/^"|"$/g, '').trim() || null,
        cuisine: values[18]?.replace(/^"|"$/g, '').trim() || null,
        price: values[42]?.replace(/^"|"$/g, '').trim() || null,
        rating: values[43]?.replace(/^"|"$/g, '').trim() || null,
        status: values[16]?.replace(/^"|"$/g, '').trim() || null,
        website: values[29]?.replace(/^"|"$/g, '').trim() || null,
        phone: values[30]?.replace(/^"|"$/g, '').trim() || null,
        opening_hours: values[31]?.replace(/^"|"$/g, '').trim() || null,
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
        city: csvPlace.city || undefined,
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

