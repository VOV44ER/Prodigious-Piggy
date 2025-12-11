export interface AvataaarsConfig {
    accessoriesType?: string;
    avatarStyle?: string;
    clotheColor?: string;
    clotheType?: string;
    eyeType?: string;
    facialHairType?: string;
    mouthType?: string;
    skinColor?: string;
    topType?: string;
}

const AVATAAARS_BASE_URL = 'https://avataaars.io';

export function generateAvataaarsUrl(config: AvataaarsConfig): string {
    const params = new URLSearchParams();

    Object.entries(config).forEach(([key, value]) => {
        if (value) {
            params.append(key, value);
        }
    });

    return `${AVATAAARS_BASE_URL}/?${params.toString()}`;
}

export const AVATAAARS_OPTIONS = {
    accessoriesType: [
        { value: 'Blank', label: 'None' },
        { value: 'Kurt', label: 'Kurt' },
        { value: 'Prescription01', label: 'Prescription 01' },
        { value: 'Prescription02', label: 'Prescription 02' },
        { value: 'Round', label: 'Round' },
        { value: 'Sunglasses', label: 'Sunglasses' },
        { value: 'Wayfarers', label: 'Wayfarers' },
    ],
    avatarStyle: [
        { value: 'Circle', label: 'Circle' },
        { value: 'Transparent', label: 'Transparent' },
    ],
    clotheColor: [
        { value: 'Black', label: 'Black' },
        { value: 'Blue01', label: 'Blue 01' },
        { value: 'Blue02', label: 'Blue 02' },
        { value: 'Blue03', label: 'Blue 03' },
        { value: 'Gray01', label: 'Gray 01' },
        { value: 'Gray02', label: 'Gray 02' },
        { value: 'Heather', label: 'Heather' },
        { value: 'PastelBlue', label: 'Pastel Blue' },
        { value: 'PastelGreen', label: 'Pastel Green' },
        { value: 'PastelOrange', label: 'Pastel Orange' },
        { value: 'PastelRed', label: 'Pastel Red' },
        { value: 'PastelYellow', label: 'Pastel Yellow' },
        { value: 'Pink', label: 'Pink' },
        { value: 'Red', label: 'Red' },
        { value: 'White', label: 'White' },
    ],
    clotheType: [
        { value: 'BlazerShirt', label: 'Blazer Shirt' },
        { value: 'BlazerSweater', label: 'Blazer Sweater' },
        { value: 'CollarSweater', label: 'Collar Sweater' },
        { value: 'GraphicShirt', label: 'Graphic Shirt' },
        { value: 'Hoodie', label: 'Hoodie' },
        { value: 'Overall', label: 'Overall' },
        { value: 'ShirtCrewNeck', label: 'Shirt Crew Neck' },
        { value: 'ShirtScoopNeck', label: 'Shirt Scoop Neck' },
        { value: 'ShirtVNeck', label: 'Shirt V Neck' },
    ],
    eyeType: [
        { value: 'Close', label: 'Close' },
        { value: 'Cry', label: 'Cry' },
        { value: 'Default', label: 'Default' },
        { value: 'Dizzy', label: 'Dizzy' },
        { value: 'EyeRoll', label: 'Eye Roll' },
        { value: 'Happy', label: 'Happy' },
        { value: 'Hearts', label: 'Hearts' },
        { value: 'Side', label: 'Side' },
        { value: 'Squint', label: 'Squint' },
        { value: 'Surprised', label: 'Surprised' },
        { value: 'Wink', label: 'Wink' },
        { value: 'WinkWacky', label: 'Wink Wacky' },
    ],
    facialHairType: [
        { value: 'Blank', label: 'None' },
        { value: 'BeardLight', label: 'Beard Light' },
        { value: 'BeardMagestic', label: 'Beard Majestic' },
        { value: 'BeardMedium', label: 'Beard Medium' },
        { value: 'MoustacheFancy', label: 'Moustache Fancy' },
        { value: 'MoustacheMagnum', label: 'Moustache Magnum' },
    ],
    mouthType: [
        { value: 'Concerned', label: 'Concerned' },
        { value: 'Default', label: 'Default' },
        { value: 'Disbelief', label: 'Disbelief' },
        { value: 'Eating', label: 'Eating' },
        { value: 'Grimace', label: 'Grimace' },
        { value: 'Sad', label: 'Sad' },
        { value: 'ScreamOpen', label: 'Scream Open' },
        { value: 'Serious', label: 'Serious' },
        { value: 'Smile', label: 'Smile' },
        { value: 'Tongue', label: 'Tongue' },
        { value: 'Twinkle', label: 'Twinkle' },
        { value: 'Vomit', label: 'Vomit' },
    ],
    skinColor: [
        { value: 'Tanned', label: 'Tanned' },
        { value: 'Yellow', label: 'Yellow' },
        { value: 'Pale', label: 'Pale' },
        { value: 'Light', label: 'Light' },
        { value: 'Brown', label: 'Brown' },
        { value: 'DarkBrown', label: 'Dark Brown' },
        { value: 'Black', label: 'Black' },
    ],
    topType: [
        { value: 'NoHair', label: 'No Hair' },
        { value: 'Eyepatch', label: 'Eyepatch' },
        { value: 'Hat', label: 'Hat' },
        { value: 'Hijab', label: 'Hijab' },
        { value: 'Turban', label: 'Turban' },
        { value: 'WinterHat1', label: 'Winter Hat 1' },
        { value: 'WinterHat2', label: 'Winter Hat 2' },
        { value: 'WinterHat3', label: 'Winter Hat 3' },
        { value: 'WinterHat4', label: 'Winter Hat 4' },
        { value: 'LongHairBigHair', label: 'Long Hair Big Hair' },
        { value: 'LongHairBob', label: 'Long Hair Bob' },
        { value: 'LongHairBun', label: 'Long Hair Bun' },
        { value: 'LongHairCurly', label: 'Long Hair Curly' },
        { value: 'LongHairCurvy', label: 'Long Hair Curvy' },
        { value: 'LongHairDreads', label: 'Long Hair Dreads' },
        { value: 'LongHairFrida', label: 'Long Hair Frida' },
        { value: 'LongHairFro', label: 'Long Hair Fro' },
        { value: 'LongHairFroBand', label: 'Long Hair Fro Band' },
        { value: 'LongHairNotTooLong', label: 'Long Hair Not Too Long' },
        { value: 'LongHairShavedSides', label: 'Long Hair Shaved Sides' },
        { value: 'LongHairMiaWallace', label: 'Long Hair Mia Wallace' },
        { value: 'LongHairStraight', label: 'Long Hair Straight' },
        { value: 'LongHairStraight2', label: 'Long Hair Straight 2' },
        { value: 'LongHairStraightStrand', label: 'Long Hair Straight Strand' },
        { value: 'ShortHairDreads01', label: 'Short Hair Dreads 01' },
        { value: 'ShortHairDreads02', label: 'Short Hair Dreads 02' },
        { value: 'ShortHairFrizzle', label: 'Short Hair Frizzle' },
        { value: 'ShortHairShaggyMullet', label: 'Short Hair Shaggy Mullet' },
        { value: 'ShortHairShortCurly', label: 'Short Hair Short Curly' },
        { value: 'ShortHairShortFlat', label: 'Short Hair Short Flat' },
        { value: 'ShortHairShortRound', label: 'Short Hair Short Round' },
        { value: 'ShortHairShortWaved', label: 'Short Hair Short Waved' },
        { value: 'ShortHairSides', label: 'Short Hair Sides' },
        { value: 'ShortHairTheCaesar', label: 'Short Hair The Caesar' },
        { value: 'ShortHairTheCaesarSidePart', label: 'Short Hair The Caesar Side Part' },
    ],
};

export const DEFAULT_AVATAAARS_CONFIG: AvataaarsConfig = {
    accessoriesType: 'Round',
    avatarStyle: 'Transparent',
    clotheColor: 'Blue01',
    clotheType: 'Hoodie',
    eyeType: 'Default',
    facialHairType: 'BeardLight',
    mouthType: 'Default',
    skinColor: 'Light',
    topType: 'ShortHairShortWaved',
};
