import { Pressable } from '@/components/common/Pressable';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Camera, Trash2, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator,  StyleSheet, Text, View } from 'react-native';

import { AuthInput } from '@/components/auth/AuthInput';
import { ProfileFormLayout } from '@/components/profile/ProfileFormLayout';
import { authTheme } from '@/constants/auth-theme';
import {
  useDeleteProfilePhoto,
  useUpdateProfile,
  useUploadProfilePhoto,
  useUserProfile,
} from '@/lib/profile/hooks';

const GENDERS = ['male', 'female', 'other'] as const;

export function EditProfileScreen() {
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadProfilePhoto();
  const deletePhoto = useDeleteProfilePhoto();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<string>('male');
  const [language, setLanguage] = useState('en');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [banner, setBanner] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName ?? '');
    setLastName(profile.lastName ?? '');
    setDisplayName(profile.displayName ?? '');
    setGender(profile.gender ?? 'male');
    setLanguage(profile.language ?? 'en');
    setDateOfBirth(profile.dateOfBirth?.slice(0, 10) ?? '');
  }, [profile]);

  const handleSave = () => {
    setBanner(null);
    updateProfile.mutate(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim(),
        gender,
        language,
        dateOfBirth: dateOfBirth.trim() || undefined,
      },
      {
        onSuccess: () =>
          setBanner({ message: 'Profile updated successfully', type: 'success' }),
        onError: (error) =>
          setBanner({
            message: error instanceof Error ? error.message : 'Update failed',
            type: 'error',
          }),
      }
    );
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setBanner({
        message: 'Photo library permission is required',
        type: 'error',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setBanner(null);
    uploadPhoto.mutate(
      {
        uri: asset.uri,
        fileName: asset.fileName ?? 'profile.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
      },
      {
        onSuccess: () =>
          setBanner({ message: 'Profile photo updated', type: 'success' }),
        onError: (error) =>
          setBanner({
            message: error instanceof Error ? error.message : 'Upload failed',
            type: 'error',
          }),
      }
    );
  };

  const handleDeletePhoto = () => {
    setBanner(null);
    deletePhoto.mutate(undefined, {
      onSuccess: () =>
        setBanner({ message: 'Profile photo removed', type: 'success' }),
      onError: (error) =>
        setBanner({
          message: error instanceof Error ? error.message : 'Remove failed',
          type: 'error',
        }),
    });
  };

  if (isLoading && !profile) {
    return (
      <ProfileFormLayout title="Edit profile">
        <ActivityIndicator color={authTheme.brand} style={{ marginTop: 40 }} />
      </ProfileFormLayout>
    );
  }

  return (
    <ProfileFormLayout
      title="Edit profile"
      subtitle="Update your personal details"
      banner={banner}
      onSave={handleSave}
      saving={updateProfile.isPending}
    >
      <View style={styles.photoSection}>
        {profile?.profilePhotoUrl ? (
          <Image
            source={{ uri: profile.profilePhotoUrl }}
            style={styles.photo}
            contentFit="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <User color={authTheme.brand} size={40} />
          </View>
        )}
        <View style={styles.photoActions}>
          <Pressable
            style={styles.photoButton}
            onPress={pickPhoto}
            disabled={uploadPhoto.isPending}
          >
            {uploadPhoto.isPending ? (
              <ActivityIndicator color={authTheme.brand} size="small" />
            ) : (
              <>
                <Camera color={authTheme.brand} size={16} />
                <Text style={styles.photoButtonText}>Upload photo</Text>
              </>
            )}
          </Pressable>
          {profile?.profilePhotoUrl ? (
            <Pressable
              style={styles.deletePhotoButton}
              onPress={handleDeletePhoto}
              disabled={deletePhoto.isPending}
            >
              <Trash2 color={authTheme.error} size={16} />
              <Text style={styles.deletePhotoText}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <AuthInput label="First name" value={firstName} onChangeText={setFirstName} />
      <AuthInput label="Last name" value={lastName} onChangeText={setLastName} />
      <AuthInput
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <AuthInput
        label="Date of birth"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        placeholder="YYYY-MM-DD"
      />
      <AuthInput
        label="Language"
        value={language}
        onChangeText={setLanguage}
        placeholder="en"
      />

      <Text style={styles.fieldLabel}>Gender</Text>
      <View style={styles.chipRow}>
        {GENDERS.map((option) => (
          <Pressable
            key={option}
            style={[styles.chip, gender === option && styles.chipActive]}
            onPress={() => setGender(option)}
          >
            <Text
              style={[styles.chipText, gender === option && styles.chipTextActive]}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
    </ProfileFormLayout>
  );
}

const styles = StyleSheet.create({
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: authTheme.brandSoft,
  },
  photoButtonText: {
    color: authTheme.brand,
    fontWeight: '700',
    fontSize: 13,
  },
  deletePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  deletePhotoText: {
    color: authTheme.error,
    fontWeight: '700',
    fontSize: 13,
  },
  fieldLabel: {
    color: authTheme.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: authTheme.inputBorder,
    backgroundColor: authTheme.card,
  },
  chipActive: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  chipText: {
    color: authTheme.text,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
