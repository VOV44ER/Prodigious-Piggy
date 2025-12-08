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

export const casablancaPlaces: Place[] = [
    {
        name: "% Arabica",
        address: "N°144 angle boulevard d'anfa et, Rue La Fontaine, Casablanca 20250, Morocco",
        category: "Cafe",
        cuisine: "Coffee",
        price: 2,
        rating: 4.5,
        sentiment: 90,
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&sig=3601",
        latitude: 33.59078632,
        longitude: -7.637088586,
    },
    {
        name: "La Sqala",
        address: "J93J+564, Bd des Almohades, Casablanca 20250, Morocco",
        category: "Restaurant",
        cuisine: "Moroccan",
        price: 2,
        rating: 4.3,
        sentiment: 86,
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&sig=1447",
        latitude: 33.5950,
        longitude: -7.6200,
    },
    {
        name: "Le Cabestan",
        address: "Phare d'El hank، 90 شارع الكورنيش، الدار البيضاء 20000, Morocco",
        category: "Restaurant",
        cuisine: "Mediterranean",
        price: 3,
        rating: 4.6,
        sentiment: 92,
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&sig=1499",
        latitude: 33.6100,
        longitude: -7.6300,
    },
    {
        name: "Le Gatsby",
        address: "Angle boulevard Sidi Mohamed Ben Abdellah et, Bd Sour Jdid, Casablanca 20020, Morocco",
        category: "Restaurant",
        cuisine: "International",
        price: 2,
        rating: 4.4,
        sentiment: 88,
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&sig=1509",
        latitude: 33.5850,
        longitude: -7.6150,
    },
    {
        name: "Maison Amande & Miel",
        address: "7 Rue d'Ifrane, Casablanca 20120, Morocco",
        category: "Bakery",
        cuisine: "French",
        price: 2,
        rating: 4.5,
        sentiment: 90,
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&sig=1677",
        latitude: 33.5800,
        longitude: -7.6100,
    },
    {
        name: "NKOA",
        address: "11, Abou Kacem Chabi Quartier, Casablanca 20060, Morocco",
        category: "Restaurant",
        cuisine: "African",
        price: 2,
        rating: 4.7,
        sentiment: 94,
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&sig=1988",
        latitude: 33.5750,
        longitude: -7.6250,
    },
    {
        name: "Pâtisserie Bennis Habous",
        address: "2, Rue Fkih El Gabbas, Casablanca 20100, Morocco",
        category: "Bakery",
        cuisine: "Moroccan",
        price: 1,
        rating: 4.8,
        sentiment: 96,
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&sig=2165",
        latitude: 33.5900,
        longitude: -7.6400,
    },
    {
        name: "Rick's Café",
        address: "Place du jardin public, 248 Bd Sour Jdid, Casablanca 20250, Morocco",
        category: "Restaurant",
        cuisine: "International",
        price: 3,
        rating: 4.6,
        sentiment: 92,
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&sig=2451",
        latitude: 33.5950,
        longitude: -7.6200,
    },
    {
        name: "Saveurs Du Palais",
        address: "28 Rue Jalal Eddine Sayouti, Casablanca 20250, Morocco",
        category: "Restaurant",
        cuisine: "Moroccan",
        price: 2,
        rating: 4.4,
        sentiment: 88,
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&sig=2591",
        latitude: 33.5850,
        longitude: -7.6150,
    },
];

