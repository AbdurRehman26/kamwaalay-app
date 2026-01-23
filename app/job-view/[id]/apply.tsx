import { ScreenHeader } from '@/components/ScreenHeader';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
interface JobSummary {
    id: string;
    serviceName: string;
    location: string;
    description: string;
    budget?: number;
    workType?: string;
    specialRequirements?: string;
}

export default function JobApplyScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [job, setJob] = useState<JobSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [message, setMessage] = useState('');
    const [proposedRate, setProposedRate] = useState('');

    // Theme colors
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const textMuted = useThemeColor({}, 'textMuted');
    const primaryColor = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const cardBg = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const errorColor = useThemeColor({}, 'error');

    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                setIsLoading(true);
                let response = await apiService.get(
                    API_ENDPOINTS.JOB_POSTS.GET,
                    { id: id as string },
                    undefined,
                    true
                );

                if (response.success && response.data) {
                    const jobData = response.data.job_post || response.data.booking || response.data;
                    setJob({
                        id: jobData.id?.toString() || id,
                        serviceName: jobData.service_type
                            ? jobData.service_type.charAt(0).toUpperCase() + jobData.service_type.slice(1).replace('_', ' ')
                            : jobData.service_name || 'Service',
                        location: (typeof jobData.city === 'string' ? jobData.city : jobData.city?.name) ||
                            (typeof jobData.location_city === 'string' ? jobData.location_city : jobData.location_city?.name) ||
                            jobData.area || jobData.location || 'Karachi',
                        description: jobData.description || '',
                        budget: jobData.monthly_rate || jobData.budget || jobData.price,
                        specialRequirements: jobData.special_requirements,
                        workType: jobData.work_type ? jobData.work_type.split(/[_\s]/).map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 'Part Time',
                    });
                }
            } catch (error) {
                console.error('Error fetching job details:', error);
                toast.error('Failed to load job details'); // Using toast here too for consistency
                router.back();
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchJobDetails();
        }
    }, [id]);

    const handleSubmit = async () => {
        if (!message.trim()) {
            toast.error('Please enter an application message.');
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = {
                message: message,
                monthly_rate: proposedRate ? parseFloat(proposedRate) : undefined,
            };

            const response = await apiService.post(
                `/job-posts/${id}/apply`,
                payload
            );

            if (response.success) {
                toast.success('Your application has been submitted!');

                // Delay redirect to allow toast to be seen
                setTimeout(() => {
                    router.dismissAll();
                    router.replace('/(tabs)/');
                }, 1000);
            } else {
                throw new Error(response.message || 'Failed to submit application');
            }
        } catch (error: any) {
            console.error('Application error:', error);
            toast.error(error.message || 'Failed to submit application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={primaryColor} />
            </View>
        );
    }

    if (!job) return null;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.container, { backgroundColor }]}>
                {/* Header */}
                <ScreenHeader title="Apply for Job" />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Job Details Card */}
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                        <View style={styles.cardHeader}>
                            <IconSymbol name="doc.text.fill" size={20} color={textMuted} />
                            <Text style={[styles.cardTitle, { color: textColor }]}>Job Details</Text>
                        </View>

                        <View style={styles.detailsGrid}>
                            <View style={[styles.detailBox, { backgroundColor: primaryLight }]}>
                                <Text style={[styles.detailLabel, { color: primaryColor }]}>Service Type</Text>
                                <Text style={[styles.detailValue, { color: textColor }]}>{job.serviceName}</Text>
                            </View>

                            <View style={[styles.detailBox, { backgroundColor: primaryLight }]}>
                                <Text style={[styles.detailLabel, { color: primaryColor }]}>Work Type</Text>
                                <Text style={[styles.detailValue, { color: textColor }]}>{job.workType}</Text>
                            </View>

                            <View style={[styles.detailBox, { backgroundColor: primaryLight, width: '100%' }]}>
                                <Text style={[styles.detailLabel, { color: primaryColor }]}>Location</Text>
                                <Text style={[styles.detailValue, { color: textColor }]}>{job.location}</Text>
                            </View>
                        </View>

                        {job.specialRequirements && (
                            <View style={[styles.specialReqBox, { backgroundColor: '#F3E8FF' }]}>
                                <IconSymbol name="exclamationmark.circle" size={16} color="#7C3AED" />
                                <View style={{ marginLeft: 8, flex: 1 }}>
                                    <Text style={[styles.detailLabel, { color: '#7C3AED', marginBottom: 2 }]}>Special Requirements</Text>
                                    <Text style={[styles.detailValue, { color: '#4C1D95' }]}>{job.specialRequirements}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Application Form */}
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginTop: 24 }]}>
                        <View style={styles.cardHeader}>
                            <IconSymbol name="pencil.and.outline" size={20} color="#F59E0B" />
                            <Text style={[styles.cardTitle, { color: textColor }]}>Your Application</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: textSecondary }]}>
                                Application Message <Text style={{ color: errorColor }}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.textArea, { backgroundColor: backgroundColor, color: textColor, borderColor }]}
                                multiline
                                numberOfLines={6}
                                placeholder="Tell the client why you're perfect for this job. Mention your experience, skills, and availability..."
                                placeholderTextColor={textMuted}
                                value={message}
                                onChangeText={setMessage}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: textSecondary }]}>Proposed Monthly Rate (PKR) (Optional)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: backgroundColor, color: textColor, borderColor }]}
                                placeholder={job.budget ? `e.g., ${job.budget}` : "e.g., 50000"}
                                placeholderTextColor={textMuted}
                                keyboardType="numeric"
                                value={proposedRate}
                                onChangeText={setProposedRate}
                            />
                        </View>
                    </View>

                </ScrollView>

                {/* Footer Actions */}
                <View style={[styles.footer, { backgroundColor: cardBg, borderTopColor: borderColor, paddingBottom: insets.bottom + 20 }]}>
                    <View style={styles.footerButtons}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { backgroundColor: '#F3F4F6' }]}
                            onPress={() => router.back()}
                            disabled={isSubmitting}
                        >
                            <Text style={[styles.cancelButtonText, { color: textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                { backgroundColor: primaryColor, opacity: isSubmitting ? 0.7 : 1 }
                            ]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Application</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View >
        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backTextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    backText: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginLeft: 12,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    detailBox: {
        width: '48%',
        padding: 12,
        borderRadius: 12,
    },
    specialReqBox: {
        flexDirection: 'row',
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        height: 150,
        fontSize: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    footerButtons: {
        flexDirection: 'row',
        gap: 16,
    },
    cancelButton: {
        flex: 1,
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        flex: 2,
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
