import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Worker {
    id: string;
    name: string;
    phoneNumber: string;
    cnic: string;
    serviceType: string;
}

export default function AddWorkersOnboardingScreen() {
    const router = useRouter();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [cnic, setCnic] = useState('');
    const [serviceType, setServiceType] = useState('');

    const handleAddWorker = () => {
        // Validate
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

        // Add worker to list
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
        // For now, just navigate to home
        router.replace('/(tabs)');
    };

    const handleSkip = () => {
        router.replace('/(tabs)');
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <ThemedText type="title" style={styles.title}>
                        Add Your Workers
                    </ThemedText>
                    <ThemedText style={styles.subtitle}>
                        Add workers to your agency roster (you can add more later)
                    </ThemedText>
                </View>

                {/* Added Workers List */}
                {workers.length > 0 && (
                    <View style={styles.workersList}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            Added Workers ({workers.length})
                        </ThemedText>
                        {workers.map((worker) => (
                            <View key={worker.id} style={styles.workerCard}>
                                <View style={styles.workerInfo}>
                                    <IconSymbol name="person.circle.fill" size={40} color="#6366F1" />
                                    <View style={styles.workerDetails}>
                                        <ThemedText style={styles.workerName}>{worker.name}</ThemedText>
                                        <ThemedText style={styles.workerPhone}>{worker.phoneNumber}</ThemedText>
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
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                        {workers.length > 0 ? 'Add Another Worker' : 'Add First Worker'}
                    </ThemedText>

                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Full Name *</ThemedText>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter worker's full name"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={setName}
                            autoComplete="name"
                            textContentType="name"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Phone Number *</ThemedText>
                        <TextInput
                            style={styles.input}
                            placeholder="03XXXXXXXXX"
                            placeholderTextColor="#999"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                            maxLength={11}
                            autoComplete="tel"
                            textContentType="telephoneNumber"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>CNIC Number *</ThemedText>
                        <TextInput
                            style={styles.input}
                            placeholder="XXXXX-XXXXXXX-X"
                            placeholderTextColor="#999"
                            value={cnic}
                            onChangeText={setCnic}
                            keyboardType="number-pad"
                            maxLength={15}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Service Type (Optional)</ThemedText>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Cleaning, Cooking, etc."
                            placeholderTextColor="#999"
                            value={serviceType}
                            onChangeText={setServiceType}
                        />
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
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.7,
    },
    workersList: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        color: '#1A1A1A',
    },
    workerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    workerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
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
    },
    form: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#1A1A1A',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366F1',
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
        gap: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    actions: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    completeButton: {
        backgroundColor: '#6366F1',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
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
        color: '#6366F1',
        fontSize: 16,
        fontWeight: '600',
    },
});
