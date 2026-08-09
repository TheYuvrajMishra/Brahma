import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProfile {
    displayName?: string;
    role?: string;
    location?: string;
    preferredHandle?: string;
}

export interface IUser extends Document {
    googleId: string;
    email: string;
    name: string;
    picture: string;
    encryptedAccessToken?: string;
    accessTokenIv?: string;
    accessTokenTag?: string;
    encryptedRefreshToken?: string;
    refreshTokenIv?: string;
    refreshTokenTag?: string;
    onboardingCompleted: boolean;
    profileDetails?: IUserProfile;
    preferences?: string;
    dislikes?: string;
    interactionStyle?: 'analytical' | 'conversational' | 'executive';
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: '' },
    picture: { type: String, default: '' },
    encryptedAccessToken: { type: String, default: '' },
    accessTokenIv: { type: String, default: '' },
    accessTokenTag: { type: String, default: '' },
    encryptedRefreshToken: { type: String, default: '' },
    refreshTokenIv: { type: String, default: '' },
    refreshTokenTag: { type: String, default: '' },
    onboardingCompleted: { type: Boolean, default: false },
    profileDetails: {
        displayName: { type: String, default: '' },
        role: { type: String, default: '' },
        location: { type: String, default: '' },
        preferredHandle: { type: String, default: '' }
    },
    preferences: { type: String, default: '' },
    dislikes: { type: String, default: '' },
    interactionStyle: { type: String, enum: ['analytical', 'conversational', 'executive'], default: 'conversational' }
}, {
    timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema);
