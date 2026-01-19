import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast';

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColor } from '@/hooks/use-theme-color';

export default function BusinessVerificationScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, refreshProfile } = useAuth();

    const [nicImage, setNicImage] = useState<string | null>(null);
    const [nicImageName, setNicImageName] = useState<string | null>(null);
    const [nicNumber, setNicNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const primaryColor = useThemeColor({}, 'primary');
    const cardBg = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const inputBg = cardBg;

    const pickNicImage = async () => {
        try {
            // Ask user to choose between camera, gallery, or document
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setNicImage(result.assets[0].uri);
                const uriParts = result.assets[0].uri.split('/');
                setNicImageName(uriParts[uriParts.length - 1]);
            }
        } catch (error) {
            console.error('Error picking NIC image:', error);
            toast.error('Failed to select image');
        }
    };

    const handleSubmit = async () => {
        console.log('[BusinessVerification] Submit pressed', { nicImage, nicNumber });

        if (!nicImage) {
            console.log('[BusinessVerification] FAILED: No NIC image');
            toast.error('Please upload your NIC image');
            return;
        }
        console.log('[BusinessVerification] NIC image check passed');

        if (!nicNumber.trim()) {
            console.log('[BusinessVerification] FAILED: No NIC number');
            toast.error('Please enter your NIC number');
            return;
        }
        console.log('[BusinessVerification] NIC number check passed');

        // Log NIC format (but don't block - allow any format for now)
        const nicWithDashes = /^\d{5}-\d{7}-\d$/;
        const nicWithoutDashes = /^\d{13}$/;
        const trimmedNic = nicNumber.trim();

        if (!nicWithDashes.test(trimmedNic) && !nicWithoutDashes.test(trimmedNic)) {
            console.log('[BusinessVerification] Warning: NIC format non-standard:', trimmedNic, '(expected 13 digits or XXXXX-XXXXXXX-X)');
            // Don't block - proceed anyway
        }

        console.log('[BusinessVerification] All validations passed, submitting...');
        setIsSubmitting(true);

        try {
            const formData = new FormData();

            // Add NIC number
            formData.append('nic_number', nicNumber.trim());

            // Add NIC image - handle web vs native differently
            if (Platform.OS === 'web') {
                // On web, fetch the blob URL and convert to File
                try {
                    const response = await fetch(nicImage);
                    const blob = await response.blob();
                    const fileName = nicImageName || 'nic.jpg';
                    const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
                    formData.append('nic', file);
                    console.log('[BusinessVerification] Web: Created File from blob', { fileName, type: file.type, size: file.size });
                } catch (blobError) {
                    console.error('[BusinessVerification] Failed to convert blob:', blobError);
                    toast.error('Failed to process image. Please try again.');
                    setIsSubmitting(false);
                    return;
                }
            } else {
                // On native, use the URI-based approach
                const uriParts = nicImage.split('.');
                const fileExt = uriParts[uriParts.length - 1].toLowerCase();
                const mimeType = fileExt === 'pdf' ? 'application/pdf' :
                    fileExt === 'png' ? 'image/png' :
                        fileExt === 'gif' ? 'image/gif' :
                            'image/jpeg';

                formData.append('nic', {
                    uri: nicImage,
                    name: nicImageName || `nic.${fileExt}`,
                    type: mimeType,
                } as any);
            }

            console.log('[BusinessVerification] Calling API:', API_ENDPOINTS.ONBOARDING.BUSINESS);

            const response = await apiService.post(
                API_ENDPOINTS.ONBOARDING.BUSINESS,
                formData,
                undefined,
                true
            );

            console.log('[BusinessVerification] API Response:', response);

            if (response.success) {
                toast.success('Verification submitted successfully!');
                // Refresh profile to update onboarding status in context
                await refreshProfile();
                router.replace('/business/dashboard');
            } else {
                toast.error(response.message || 'Failed to submit verification');
            }
        } catch (error: any) {
            console.error('Error submitting verification:', error);
            toast.error(error.message || 'Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Main Card */}
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                        {/* Header */}
                        <Text style={[styles.title, { color: textColor }]}>
                            VERIFY YOUR BUSINESS DETAILS
                        </Text>
                        <Text style={[styles.subtitle, { color: textSecondary }]}>
                            Upload your NIC document to verify your business identity. This helps build trust with customers and workers.
                        </Text>

                        {/* NIC Image Upload */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>
                                NIC Image <Text style={{ color: primaryColor }}>*</Text>
                            </Text>
                            <TouchableOpacity
                                style={[styles.uploadArea, { borderColor: primaryColor, backgroundColor: inputBg }]}
                                onPress={pickNicImage}
                            >
                                {nicImage ? (
                                    <View style={styles.uploadedContent}>
                                        {nicImage.toLowerCase().endsWith('.pdf') ? (
                                            <IconSymbol name="doc.fill" size={48} color={textSecondary} />
                                        ) : (
                                            <Image source={{ uri: nicImage }} style={styles.previewImage} />
                                        )}
                                        <Text style={[styles.fileName, { color: textSecondary }]} numberOfLines={1}>
                                            {nicImageName}
                                        </Text>
                                        <Text style={[styles.changeText, { color: primaryColor }]}>
                                            Tap to change
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <IconSymbol name="doc.fill" size={48} color={textSecondary} />
                                        <Text style={[styles.uploadText, { color: textSecondary }]}>
                                            Upload NIC (JPG, PNG, PDF)
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* NIC Number */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>
                                NIC Number <Text style={{ color: primaryColor }}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                                placeholder="e.g. 4210112345678"
                                placeholderTextColor={textSecondary}
                                value={nicNumber}
                                onChangeText={(text) => setNicNumber(text.replace(/[^0-9]/g, ''))}
                                maxLength={13}
                                keyboardType="number-pad"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* Submit Card */}
                    <View style={[styles.submitCard, { backgroundColor: cardBg, borderColor }]}>
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: primaryColor }]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Complete Verification</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 24,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 28,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    uploadArea: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 160,
    },
    uploadPlaceholder: {
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 12,
        fontSize: 14,
    },
    uploadedContent: {
        alignItems: 'center',
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    fileName: {
        marginTop: 12,
        fontSize: 14,
        maxWidth: 200,
    },
    changeText: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
    },
    submitCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 24,
    },
    submitButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        alignSelf: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
