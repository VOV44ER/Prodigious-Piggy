import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { generateAvataaarsUrl, AVATAAARS_OPTIONS, DEFAULT_AVATAAARS_CONFIG, AvataaarsConfig } from "@/lib/avataaars";
import { RefreshCw } from "lucide-react";

interface AvataaarsPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (avatarUrl: string) => void;
    currentConfig?: AvataaarsConfig;
}

export function AvataaarsPicker({ open, onOpenChange, onSelect, currentConfig }: AvataaarsPickerProps) {
    const [config, setConfig] = useState<AvataaarsConfig>(currentConfig || DEFAULT_AVATAAARS_CONFIG);
    const [avatarUrl, setAvatarUrl] = useState<string>("");

    useEffect(() => {
        const url = generateAvataaarsUrl(config);
        setAvatarUrl(url);
    }, [config]);

    const handleRandomize = () => {
        const randomConfig: AvataaarsConfig = {
            accessoriesType: AVATAAARS_OPTIONS.accessoriesType[
                Math.floor(Math.random() * AVATAAARS_OPTIONS.accessoriesType.length)
            ].value,
            avatarStyle: AVATAAARS_OPTIONS.avatarStyle[
                Math.floor(Math.random() * AVATAAARS_OPTIONS.avatarStyle.length)
            ].value,
            clotheColor: AVATAAARS_OPTIONS.clotheColor[
                Math.floor(Math.random() * AVATAAARS_OPTIONS.clotheColor.length)
            ].value,
            clotheType: AVATAAARS_OPTIONS.clotheType[
                Math.floor(Math.random() * AVATAAARS_OPTIONS.clotheType.length)
            ].value,
            eyeType: AVATAAARS_OPTIONS.eyeType[
                Math.floor(Math.random() * AVATAAARS_OPTIONS.eyeType.length)
            ].value,
            facialHairType: AVATAAARS_OPTIONS.facialHairType[
                Math.floor(Math.random() * AVATAAARS_OPTIONS.facialHairType.length)
            ].value,
            mouthType: AVATAAARS_OPTIONS.mouthType[
                Math.floor(Math.random() * AVATAAARS_OPTIONS.mouthType.length)
            ].value,
            skinColor: AVATAAARS_OPTIONS.skinColor[
                Math.floor(Math.random() * AVATAAARS_OPTIONS.skinColor.length)
            ].value,
            topType: AVATAAARS_OPTIONS.topType[
                Math.floor(Math.random() * AVATAAARS_OPTIONS.topType.length)
            ].value,
        };
        setConfig(randomConfig);
    };

    const handleSave = () => {
        onSelect(avatarUrl);
        onOpenChange(false);
    };

    return (
        <Dialog open={ open } onOpenChange={ onOpenChange }>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Choose Avatar</DialogTitle>
                    <DialogDescription>
                        Customize your avatar by selecting different options
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                        <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg border-2 border-border">
                            <img
                                src={ avatarUrl }
                                alt="Avatar Preview"
                                className="w-48 h-48 object-contain"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={ handleRandomize }
                            className="w-full"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Random Avatar
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Avatar Style</Label>
                            <Select
                                value={ config.avatarStyle || "" }
                                onValueChange={ (value) => setConfig({ ...config, avatarStyle: value }) }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    { AVATAAARS_OPTIONS.avatarStyle.map((option) => (
                                        <SelectItem key={ option.value } value={ option.value }>
                                            { option.label }
                                        </SelectItem>
                                    )) }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Hair Type</Label>
                            <Select
                                value={ config.topType || "" }
                                onValueChange={ (value) => setConfig({ ...config, topType: value }) }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    { AVATAAARS_OPTIONS.topType.map((option) => (
                                        <SelectItem key={ option.value } value={ option.value }>
                                            { option.label }
                                        </SelectItem>
                                    )) }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Skin Color</Label>
                            <Select
                                value={ config.skinColor || "" }
                                onValueChange={ (value) => setConfig({ ...config, skinColor: value }) }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    { AVATAAARS_OPTIONS.skinColor.map((option) => (
                                        <SelectItem key={ option.value } value={ option.value }>
                                            { option.label }
                                        </SelectItem>
                                    )) }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Clothe Type</Label>
                            <Select
                                value={ config.clotheType || "" }
                                onValueChange={ (value) => setConfig({ ...config, clotheType: value }) }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    { AVATAAARS_OPTIONS.clotheType.map((option) => (
                                        <SelectItem key={ option.value } value={ option.value }>
                                            { option.label }
                                        </SelectItem>
                                    )) }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Clothe Color</Label>
                            <Select
                                value={ config.clotheColor || "" }
                                onValueChange={ (value) => setConfig({ ...config, clotheColor: value }) }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    { AVATAAARS_OPTIONS.clotheColor.map((option) => (
                                        <SelectItem key={ option.value } value={ option.value }>
                                            { option.label }
                                        </SelectItem>
                                    )) }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Accessories</Label>
                            <Select
                                value={ config.accessoriesType || "" }
                                onValueChange={ (value) => setConfig({ ...config, accessoriesType: value }) }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    { AVATAAARS_OPTIONS.accessoriesType.map((option) => (
                                        <SelectItem key={ option.value } value={ option.value }>
                                            { option.label }
                                        </SelectItem>
                                    )) }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Eye Type</Label>
                            <Select
                                value={ config.eyeType || "" }
                                onValueChange={ (value) => setConfig({ ...config, eyeType: value }) }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    { AVATAAARS_OPTIONS.eyeType.map((option) => (
                                        <SelectItem key={ option.value } value={ option.value }>
                                            { option.label }
                                        </SelectItem>
                                    )) }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Facial Hair</Label>
                            <Select
                                value={ config.facialHairType || "" }
                                onValueChange={ (value) => setConfig({ ...config, facialHairType: value }) }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    { AVATAAARS_OPTIONS.facialHairType.map((option) => (
                                        <SelectItem key={ option.value } value={ option.value }>
                                            { option.label }
                                        </SelectItem>
                                    )) }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Mouth</Label>
                            <Select
                                value={ config.mouthType || "" }
                                onValueChange={ (value) => setConfig({ ...config, mouthType: value }) }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    { AVATAAARS_OPTIONS.mouthType.map((option) => (
                                        <SelectItem key={ option.value } value={ option.value }>
                                            { option.label }
                                        </SelectItem>
                                    )) }
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={ () => onOpenChange(false) }>
                        Cancel
                    </Button>
                    <Button type="button" onClick={ handleSave }>
                        Save Avatar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
