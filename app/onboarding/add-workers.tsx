import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Worker {
    id: string;
    name: string;
    phoneNumber: string;
    cnic: string;
    serviceType: string;
}

export default function AddWorkersOnboardingScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [cnic, setCnic] = useState('');
    const [serviceType, setServiceType] = useState('');

    const handleAddWorker = () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Worker name is required');
            return;
        }

        if (!phoneNumber.trim()) {
            Alert.alert('Required', 'Phone number is required');
            return;
        }

        if (!cnic.trim()) {
            Alert.alert('Required', 'CNIC number is required');
            return;
        }

        const newWorker: Worker = {
            id: Date.now().toString(),
            name: name.trim(),
            phoneNumber: phoneNumber.trim(),
            cnic: cnic.trim(),
            serviceType: serviceType.trim(),
        };

        setWorkers([...workers, newWorker]);

        // Clear form
        setName('');
        setPhoneNumber('');
        setCnic('');
        setServiceType('');

        Alert.alert('Success', 'Worker added successfully');
    };

    const handleRemoveWorker = (id: string) => {
        setWorkers(workers.filter(w => w.id !== id));
    };

    const handleComplete = async () => {
        // TODO: Submit workers to API
        router.replace('/(tabs)');
    };

    const handleSkip = () => {
        router.replace('/(tabs)');
    };

    return (
        <View style={styles.container}>
            {/* Decorative Background Elements */}
            <View style={styles.topCircle} />
            <View style={styles.bottomCircle} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.headerSection, { marginTop: insets.top + 20 }]}>
                        <Text style={styles.title}>Add Your Workers</Text>
                        <Text style={styles.subtitle}>
                            Add workers to your agency roster (you can add more later)
                        </Text>
                    </View>

                    {/* Added Workers List */}
                    {workers.length > 0 && (
                        <View style={styles.workersList}>
                            <Text style={styles.sectionTitle}>
                                Added Workers ({workers.length})
                            </Text>
                            {workers.map((worker) => (
                                <View key={worker.id} style={styles.workerCard}>
                                    <View style={styles.workerInfo}>
                                        <View style={styles.workerIconContainer}>
                                            <IconSymbol name="person.fill" size={24} color="#6366F1" />
                                        </View>
                                        <View style={styles.workerDetails}>
                                            <Text style={styles.workerName}>{worker.name}</Text>
                                            <Text style={styles.workerPhone}>{worker.phoneNumber}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleRemoveWorker(worker.id)}
                                        style={styles.removeButton}
                                    >
                                        <IconSymbol name="trash.fill" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Add Worker Form */}
                    <View style={styles.form}>
                        <Text style={styles.sectionTitle}>
                            {workers.length > 0 ? 'Add Another Worker' : 'Add First Worker'}
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <IconSymbol name="person.fill" size={20} color="#A0A0A0" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter worker's full name"
                                    placeholderTextColor="#A0A0A0"
                                    value={name}
                                    onChangeText={setName}
                                    autoComplete="name"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <View style={styles.inputWrapper}>
                                <IconSymbol name="phone.fill" size={20} color="#A0A0A0" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="03XXXXXXXXX"
                                    placeholderTextColor="#A0A0A0"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                    autoComplete="tel"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>CNIC Number</Text>
                            <View style={styles.inputWrapper}>
                                <IconSymbol name="creditcard.fill" size={20} color="#A0A0A0" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="XXXXX-XXXXXXX-X"
                                    placeholderTextColor="#A0A0A0"
                                    value={cnic}
                                    onChangeText={setCnic}
                                    keyboardType="number-pad"
                                    maxLength={15}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Service Type (Optional)</Text>
                            <View style={styles.inputWrapper}>
                                <IconSymbol name="briefcase.fill" size={20} color="#A0A0A0" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., Cleaning, Cooking"
                                    placeholderTextColor="#A0A0A0"
                                    value={serviceType}
                                    onChangeText={setServiceType}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleAddWorker}
                        >
                            <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                            <Text style={styles.addButtonText}>Add Worker</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        {workers.length > 0 && (
                            <TouchableOpacity
                                style={styles.completeButton}
                                onPress={handleComplete}
                            >
                                <Text style={styles.completeButtonText}>
                                    Complete Setup ({workers.length} worker{workers.length > 1 ? 's' : ''})
                                </Text>
                                <IconSymbol name="arrow.right" size={20} color="#FFF" />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={handleSkip}
                        >
                            <Text style={styles.skipButtonText}>
                                {workers.length > 0 ? 'Done for now' : 'Skip for now'}
                            </Text>
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
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    topCircle: {
        position: 'absolute',
        top: -width * 0.4,
        right: -width * 0.2,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: '#EEF2FF',
        opacity: 0.7,
    },
    bottomCircle: {
        position: 'absolute',
        bottom: -width * 0.3,
        left: -width * 0.2,
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: width * 0.35,
        backgroundColor: '#F5F3FF',
        opacity: 0.7,
    },
    headerSection: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        lineHeight: 24,
    },
    workersList: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    workerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    workerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    workerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    workerDetails: {
        flex: 1,
    },
    workerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    workerPhone: {
        fontSize: 14,
        color: '#666',
    },
    removeButton: {
        padding: 8,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
    },
    form: {
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 56,
        overflow: 'hidden',
    },
    inputIcon: {
        marginLeft: 16,
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        padding: 16,
        borderRadius: 16,
        marginTop: 8,
        gap: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    actions: {
        paddingBottom: 40,
    },
    completeButton: {
        backgroundColor: '#6366F1',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        gap: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    completeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    skipButton: {
        padding: 16,
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
});
